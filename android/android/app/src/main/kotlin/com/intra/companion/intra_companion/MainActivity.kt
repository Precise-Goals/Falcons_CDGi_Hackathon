package com.intra.companion.intra_companion

import android.Manifest
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.ParcelUuid
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.util.*

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.intra.companion/ble"
    private var methodChannel: MethodChannel? = null

    private var bluetoothManager: BluetoothManager? = null
    private var bluetoothAdapter: BluetoothAdapter? = null
    private var bluetoothLeAdvertiser: BluetoothLeAdvertiser? = null
    private var gattServer: BluetoothGattServer? = null

    private var isAdvertising = false
    private var isConnected = false
    private var connectedDevice: BluetoothDevice? = null

    // UUIDs matching BleService.dart and ImprovementPlan.md
    private val SERVICE_UUID = UUID.fromString("19e2613e-9ed7-3d97-0af0-6bca28e799e5")
    private val CHAR_DRIFT_ALERT = UUID.fromString("19e2613e-9ed7-3d97-0af0-6bca28e70001")
    private val CHAR_ADAPTER_ACTION = UUID.fromString("19e2613e-9ed7-3d97-0af0-6bca28e70002")
    private val CHAR_HEARTBEAT = UUID.fromString("19e2613e-9ed7-3d97-0af0-6bca28e70003")
    private val CHAR_TELEMETRY = UUID.fromString("19e2613e-9ed7-3d97-0af0-6bca28e70004")

    private val PERMISSION_REQUEST_CODE = 1001

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            isAdvertising = true
            android.util.Log.i("IntraBLE", "GATT Advertising successfully started for service $SERVICE_UUID")
            runOnUiThread {
                methodChannel?.invokeMethod("onBleConnectionStateChanged", "advertising")
            }
        }

        override fun onStartFailure(errorCode: Int) {
            isAdvertising = false
            android.util.Log.e("IntraBLE", "GATT Advertising failed with errorCode: $errorCode")
            runOnUiThread {
                methodChannel?.invokeMethod("onBleAdvertisingFailed", errorCode)
                methodChannel?.invokeMethod("onBleConnectionStateChanged", "disconnected")
            }
        }
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice?, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                isConnected = true
                connectedDevice = device
                android.util.Log.i("IntraBLE", "GATT Client connected: ${device?.address}")
                runOnUiThread {
                    methodChannel?.invokeMethod("onBleConnectionStateChanged", "connected")
                }
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                isConnected = false
                connectedDevice = null
                android.util.Log.i("IntraBLE", "GATT Client disconnected")
                runOnUiThread {
                    methodChannel?.invokeMethod(
                        "onBleConnectionStateChanged",
                        if (isAdvertising) "advertising" else "disconnected"
                    )
                }
            }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice?,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic?,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
            }
            if (value != null) {
                runOnUiThread {
                    methodChannel?.invokeMethod("onBlePacketReceived", value)
                }
            }
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice?,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic?
        ) {
            val responseValue = when (characteristic?.uuid) {
                CHAR_HEARTBEAT -> "alive".toByteArray(Charsets.UTF_8)
                CHAR_TELEMETRY -> "intra-hardware-node-v1".toByteArray(Charsets.UTF_8)
                else -> ByteArray(0)
            }
            gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, responseValue)
        }
    }

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)

        bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        bluetoothAdapter = bluetoothManager?.adapter

        methodChannel?.setMethodCallHandler { call, result ->
            when (call.method) {
                "requestPermissions" -> {
                    val hasPerms = checkAndRequestPermissions()
                    result.success(hasPerms)
                }
                "startAdvertising" -> {
                    if (!hasPermissions()) {
                        checkAndRequestPermissions()
                        result.success(false)
                        return@setMethodCallHandler
                    }
                    val success = startGattServerAndAdvertising()
                    result.success(success)
                }
                "stopAdvertising" -> {
                    stopGattServerAndAdvertising()
                    result.success(true)
                }
                "checkPairing" -> {
                    result.success(
                        mapOf(
                            "connected" to isConnected,
                            "advertising" to isAdvertising,
                            "deviceName" to (connectedDevice?.name ?: if (isAdvertising) "Intra Companion Node (Broadcasting)" else "Disconnected"),
                            "latency" to 14,
                            "rssi" to -48
                        )
                    )
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun hasPermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED &&
            ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
        } else {
            ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun checkAndRequestPermissions(): Boolean {
        val needed = mutableListOf<String>()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.BLUETOOTH_ADVERTISE)
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.BLUETOOTH_CONNECT)
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.BLUETOOTH_SCAN)
            }
        } else {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.ACCESS_FINE_LOCATION)
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.ACCESS_COARSE_LOCATION)
            }
        }

        return if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQUEST_CODE)
            false
        } else {
            true
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            if (allGranted) {
                android.util.Log.i("IntraBLE", "Bluetooth permissions granted by operator")
                startGattServerAndAdvertising()
            }
        }
    }

    private fun startGattServerAndAdvertising(): Boolean {
        val adapter = bluetoothAdapter ?: return false
        if (!adapter.isEnabled) return false

        try {
            // Set device local name if permitted
            try {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                    adapter.name = "Intra Airlink Companion"
                }
            } catch (_: Exception) {}

            if (gattServer == null && bluetoothManager != null) {
                gattServer = bluetoothManager?.openGattServer(this, gattServerCallback)
                val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)

                val charAlert = BluetoothGattCharacteristic(
                    CHAR_DRIFT_ALERT,
                    BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                    BluetoothGattCharacteristic.PERMISSION_WRITE
                )
                val charAction = BluetoothGattCharacteristic(
                    CHAR_ADAPTER_ACTION,
                    BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                    BluetoothGattCharacteristic.PERMISSION_WRITE
                )
                val charHeartbeat = BluetoothGattCharacteristic(
                    CHAR_HEARTBEAT,
                    BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                    BluetoothGattCharacteristic.PERMISSION_READ
                )
                val charTelemetry = BluetoothGattCharacteristic(
                    CHAR_TELEMETRY,
                    BluetoothGattCharacteristic.PROPERTY_READ,
                    BluetoothGattCharacteristic.PERMISSION_READ
                )

                service.addCharacteristic(charAlert)
                service.addCharacteristic(charAction)
                service.addCharacteristic(charHeartbeat)
                service.addCharacteristic(charTelemetry)
                gattServer?.addService(service)
            }

            bluetoothLeAdvertiser = adapter.bluetoothLeAdvertiser
            if (bluetoothLeAdvertiser == null) return false

            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(true)
                .setTimeout(0)
                .build()

            // Crucial: Primary advertisement packet ONLY includes Service UUID to stay under 31 bytes
            val data = AdvertiseData.Builder()
                .addServiceUuid(ParcelUuid(SERVICE_UUID))
                .setIncludeTxPowerLevel(false)
                .setIncludeDeviceName(false)
                .build()

            // Scan Response packet contains Device Name and Tx Power Level (secondary 31-byte budget)
            val scanResponse = AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .setIncludeTxPowerLevel(true)
                .build()

            bluetoothLeAdvertiser?.startAdvertising(settings, data, scanResponse, advertiseCallback)
            return true
        } catch (e: SecurityException) {
            android.util.Log.e("IntraBLE", "SecurityException during startAdvertising: ${e.message}")
            return false
        } catch (e: Exception) {
            android.util.Log.e("IntraBLE", "Exception during startAdvertising: ${e.message}")
            return false
        }
    }

    private fun stopGattServerAndAdvertising() {
        try {
            bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback)
        } catch (_: Exception) {}
        try {
            gattServer?.close()
            gattServer = null
        } catch (_: Exception) {}
        isAdvertising = false
        isConnected = false
    }

    override fun onDestroy() {
        stopGattServerAndAdvertising()
        super.onDestroy()
    }
}
