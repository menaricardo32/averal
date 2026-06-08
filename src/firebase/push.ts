import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { collection, doc, setDoc, getDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// Store device registration status/token
export async function registerPushToken(token: string, adminEmail: string) {
  try {
    const tokenRef = doc(db, 'admin_push_tokens', token);
    await setDoc(tokenRef, {
      token,
      adminEmail,
      platform: Capacitor.getPlatform(),
      userAgent: navigator.userAgent,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('Token de notificación registrado con éxito:', token);
  } catch (error) {
    console.error('Error al registrar token en FireStore:', error);
  }
}

// Check notification permission
export async function getNotificationPermissionState(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await PushNotifications.checkPermissions();
      return perm.receive;
    } catch (e) {
      console.warn('Error al verificar permisos de Capacitor:', e);
      return 'denied';
    }
  }

  if ('Notification' in window) {
    return Notification.permission;
  }

  return 'denied';
}

// Request permission and register devices for notifications
export async function requestPushPermission(adminEmail: string): Promise<boolean> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive === 'granted') {
        // Register to receive tokens
        await PushNotifications.register();
        
        // Listeners for native push events
        await PushNotifications.addListener('registration', async (token) => {
          if (token && token.value) {
            await registerPushToken(token.value, adminEmail);
          }
        });

        await PushNotifications.addListener('registrationError', (err) => {
          console.error('Capacitor push registration error:', err);
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al solicitar permiso en Capacitor:', error);
      return false;
    }
  }

  // Fallback to Web Push Notifications API
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Save web device token fallback inside firestore
        // Since Firebase Web Messaging registration requires a full setup with VAPID key which could be empty
        // We register the user's active device identifier as a listener so they can instantly receive order alerts.
        const fakeToken = `web_channel_${adminEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').slice(-20)}`;
        await registerPushToken(fakeToken, adminEmail);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al solicitar permiso de notificación web:', error);
      return false;
    }
  }

  console.warn('Este dispositivo no soporta Notificaciones.');
  return false;
}

// Initialize real-time notification watcher for active admins in the dashboard
export function initAdminOrderNotifications() {
  if (!('Notification' in window)) return () => {};

  // Track the timestamp of the session startup
  const localPageLoadTime = Date.now();

  const ordersRef = collection(db, 'orders');
  // Order by createdAt descending, limited to most recent
  const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(1));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const orderData = change.doc.data();
        
        // Convert firestore timestamp securely to JS Milliseconds
        let orderTimeMs = 0;
        if (orderData.createdAt) {
          if (typeof orderData.createdAt.toMillis === 'function') {
            orderTimeMs = orderData.createdAt.toMillis();
          } else if (orderData.createdAt.seconds) {
            orderTimeMs = orderData.createdAt.seconds * 1000;
          } else {
            orderTimeMs = new Date(orderData.createdAt).getTime();
          }
        } else {
          // Fallback if timestamp not written yet
          orderTimeMs = Date.now();
        }

        // Only pop notification if the order was created AFTER the user loaded the page
        if (orderTimeMs > localPageLoadTime - 30000) { // Max 30s buffer for fast sync
          const total = orderData.totalPrice || orderData.total || 0;
          const formattedTotal = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
          }).format(total);

          const clientName = orderData.customerName || 'Cliente de Averal';

          if (Notification.permission === 'granted') {
            new Notification('🛒 ¡Nuevo Pedido Recibido!', {
              body: `Total: ${formattedTotal} - Por ${clientName}`,
              icon: 'https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596645793_1_7._Si_mbolo_Oficial.webp?alt=media&token=af4e2dc4-b078-4890-9592-853367e92d81',
              badge: 'https://firebasestorage.googleapis.com/v0/b/cosmeticos-storeonline.firebasestorage.app/o/galeria%2F1780596645793_1_7._Si_mbolo_Oficial.webp?alt=media&token=af4e2dc4-b078-4890-9592-853367e92d81',
              tag: change.doc.id, // Prevent duplicates
              vibrate: [200, 100, 200]
            } as any);
          }
        }
      }
    });
  });

  return unsubscribe;
}
