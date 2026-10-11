package com.intra.companion.intra_companion

import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import androidx.annotation.NonNull
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

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            isAdvertising = true
            runOnUiThread {
                methodChannel?.invokeMethod("onBleConnectionStateChanged", "advertising")
            }
        }

        override fun onStartFailure(errorCode: Int) {
            isAdvertising = false
            runOnUiThread {
                methodChannel?.invokeMethod("onBleConnectionStateChanged", "disconnected")
            }
        }
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice?, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                isConnected = true
                connectedDevice = device
                runOnUiThread {
                    methodChannel?.invokeMethod("onBleConnectionStateChanged", "connected")
                }
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                isConnected = false
                connectedDevice = null
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
                "startAdvertising" -> {
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
                            "deviceName" to (connectedDevice?.name ?: if (isAdvertising) "Intra Companion (Advertising)" else "Disconnected"),
                            "latency" to 14,
                            "rssi" to -48
                        )
                    )
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun startGattServerAndAdvertising(): Boolean {
        val adapter = bluetoothAdapter ?: return false
        if (!adapter.isEnabled) return false

        try {
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

            val data = AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .addServiceUuid(ParcelUuid(SERVICE_UUID))
                .build()

            val scanResponse = AdvertiseData.Builder()
                .setIncludeTxPowerLevel(true)
                .build()

            bluetoothLeAdvertiser?.startAdvertising(settings, data, scanResponse, advertiseCallback)
            return true
        } catch (e: SecurityException) {
            return false
        } catch (e: Exception) {
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
