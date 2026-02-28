import React, { useEffect } from "react";
import { View, ActivityIndicator, BackHandler, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const RAZORPAY_KEY_ID = "rzp_test_SEr0Dn9sZ2CsDF";

type RazorpayPaymentScreenProps = {
  amount: number | string;
  name: string;
  email: string;
  contact: string;
  orderId: string;
  onSuccess: (data: any) => void;
  onFailure: (data: any) => void;
};

const RazorpayPaymentScreen: React.FC<RazorpayPaymentScreenProps> = ({
  amount,
  name,
  email,
  contact,
  orderId,
  onSuccess,
  onFailure,
}) => {

  // ✅ Handle Android hardware back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onFailure({ cancelled: true });
        return true; // block default
      }
    );

    return () => {
      backHandler.remove();
    };
  }, [onFailure]);

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <script>
          setTimeout(function() {
  var options = {
    key: "${RAZORPAY_KEY_ID}",
    amount: "${amount}",
    currency: "INR",
    name: "${name}",
    description: "Order Payment",
    order_id: "${orderId}",
    handler: function (response){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        success: true,
        ...response
      }));
    },
    modal: {
      ondismiss: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: false,
          cancelled: true
        }));
      }
    },
    prefill: {
      email: "${email}",
      contact: "${contact}"
    },
    theme: { color: "#C15E9C" }
  };

  var rzp = new Razorpay(options);

  rzp.on('payment.failed', function (response){
    window.ReactNativeWebView.postMessage(JSON.stringify({
      success: false,
      error: response.error
    }));
  });

  rzp.open();

}, 500);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: "#C15E9C" }}>
      <StatusBar barStyle="light-content" backgroundColor="#C15E9C" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}

          onMessage={(event) => {
            console.log("RAW MESSAGE:", event.nativeEvent.data);

            try {
              const data = JSON.parse(event.nativeEvent.data);

              if (data.success) {
                onSuccess(data);
              } else {
                onFailure(data);
              }
            } catch (error) {
              console.log("Message parse error:", error);
            }
          }}

          onNavigationStateChange={(navState) => {
            if (!navState.loading && navState.canGoBack) {
              // block internal navigation
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
};

export default RazorpayPaymentScreen;
