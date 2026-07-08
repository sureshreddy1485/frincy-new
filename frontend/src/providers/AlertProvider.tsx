import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StyleSheet, View, DeviceEventEmitter } from 'react-native';
import { Portal, Dialog, Button, Text, useTheme } from 'react-native-paper';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  dismissable?: boolean;
}

interface AlertContextType {
  alert: (title: string, message: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useCustomAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useCustomAlert must be used within an AlertProvider');
  return context.alert;
};

export const CustomAlert = {
  alert: (title: string, message: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => {
    DeviceEventEmitter.emit('SHOW_CUSTOM_ALERT', { title, message, buttons, options });
  }
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState<AlertOptions | null>(null);

  const alert = useCallback((title: string, message: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => {
    setAlertData({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      dismissable: options?.cancelable ?? true,
    });
    setVisible(true);
  }, []);

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('SHOW_CUSTOM_ALERT', (data) => {
      alert(data.title, data.message, data.buttons, data.options);
    });
    return () => sub.remove();
  }, [alert]);

  const hideDialog = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <Portal>
        <Dialog visible={visible} onDismiss={alertData?.dismissable ? hideDialog : undefined} style={styles.dialog}>
          <Dialog.Title style={styles.title}>{alertData?.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{alertData?.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            {alertData?.buttons?.map((btn, index) => (
              <Button
                key={index}
                onPress={() => {
                  hideDialog();
                  btn.onPress?.();
                }}
                textColor={btn.style === 'destructive' ? theme.colors.error : theme.colors.primary}
                style={{ marginLeft: 8 }}
              >
                {btn.text}
              </Button>
            ))}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  dialog: { borderRadius: 16 },
  title: { fontWeight: 'bold' }
});
