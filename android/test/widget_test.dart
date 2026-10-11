import 'package:flutter_test/flutter_test.dart';
import 'package:intra_companion/main.dart';
import 'package:intra_companion/services/firebase_service.dart';
import 'package:intra_companion/services/engine_client.dart';

void main() {
  testWidgets('Intra Companion App renders login screen initially', (WidgetTester tester) async {
    final firebaseService = FirebaseService();
    final engineClient = EngineClient(firebaseService: firebaseService);

    await tester.pumpWidget(IntraCompanionApp(
      firebaseService: firebaseService,
      engineClient: engineClient,
    ));

    expect(find.text('INTRA'), findsOneWidget);
    expect(find.text('Sign In via Firebase'), findsOneWidget);
  });
}
