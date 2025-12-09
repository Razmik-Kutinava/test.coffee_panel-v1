import { createSignal, onMount, onCleanup, For, Show, createEffect } from 'solid-js';
import { io, Socket } from 'socket.io-client';

interface TVBoardProps {
  locations: any[];
}

interface BoardOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  waitingMinutes?: number;
  readyMinutes?: number;
}

interface BoardData {
  location: {
    id: string;
    name: string;
    address: string;
  };
  preparing: BoardOrder[];
  ready: BoardOrder[];
  stats: {
    completedToday: number;
    currentQueue: number;
    readyToPickup: number;
  };
}

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function TVBoard(props: TVBoardProps) {
  const [boardData, setBoardData] = createSignal<BoardData | null>(null);
  const [selectedLocation, setSelectedLocation] = createSignal<string>('');
  const [socket, setSocket] = createSignal<Socket | null>(null);
  const [connected, setConnected] = createSignal(false);
  const [showSelector, setShowSelector] = createSignal(true);
  const [newReadyOrder, setNewReadyOrder] = createSignal<BoardOrder | null>(null);
  const [currentTime, setCurrentTime] = createSignal(new Date());

  // Update time every minute
  onMount(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    onCleanup(() => clearInterval(timer));
  });

  // Fetch board data
  const fetchBoardData = async (locationId: string) => {
    try {
      const res = await fetch(`${API_URL}/tv-board/location/${locationId}`);
      const data = await res.json();
      setBoardData(data);
    } catch (err) {
      console.error('Failed to fetch board data:', err);
    }
  };

  // Initialize WebSocket
  const initSocket = () => {
    const ws = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    ws.on('connect', () => {
      console.log('TV Board WebSocket connected');
      setConnected(true);
    });

    ws.on('disconnect', () => {
      console.log('TV Board WebSocket disconnected');
      setConnected(false);
    });

    ws.on('tvboard_update', (data: { preparing: BoardOrder[]; ready: BoardOrder[] }) => {
      console.log('TV Board update:', data);
      setBoardData(prev => prev ? { ...prev, preparing: data.preparing, ready: data.ready } : null);
    });

    ws.on('order_ready', (order: BoardOrder) => {
      console.log('Order ready:', order);
      setNewReadyOrder(order);
      playReadySound();
      // Clear highlight after animation
      setTimeout(() => setNewReadyOrder(null), 5000);
    });

    ws.on('order_completed', ({ orderId }: { orderId: string }) => {
      console.log('Order completed:', orderId);
      setBoardData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ready: prev.ready.filter(o => o.id !== orderId),
        };
      });
    });

    setSocket(ws);
    return ws;
  };

  // Subscribe to location
  createEffect(() => {
    const locationId = selectedLocation();
    const ws = socket();

    if (locationId && ws) {
      ws.emit('subscribe_tvboard', locationId);
      fetchBoardData(locationId);
      setShowSelector(false);
    }
  });

  // Play ready sound
  const playReadySound = () => {
    try {
      // Simple bell sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Could not play sound');
    }
  };

  // Start TV Board mode
  const startBoard = (locationId: string) => {
    setSelectedLocation(locationId);
    initSocket();
    // Request fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Location selector screen
  if (showSelector()) {
    return (
      <div style={{
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        'min-height': '100vh',
        background: '#0a0a0f',
        color: '#fff',
        'font-family': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{ 'font-size': '72px', 'margin-bottom': '24px' }}>☕</div>
        <h1 style={{ 'font-size': '36px', 'margin-bottom': '16px', 'font-weight': '700' }}>TV Борд</h1>
        <p style={{ 'font-size': '18px', color: '#888', 'margin-bottom': '48px' }}>Выберите точку для отображения</p>

        <div style={{ display: 'grid', gap: '16px', 'max-width': '600px', width: '100%', padding: '0 24px' }}>
          <For each={props.locations}>
            {(loc) => (
              <button
                onClick={() => startBoard(loc.id)}
                style={{
                  padding: '24px 32px',
                  'border-radius': '16px',
                  border: '2px solid #333',
                  background: '#1a1a2e',
                  color: '#fff',
                  'font-size': '20px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  'text-align': 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00ff88';
                  e.currentTarget.style.background = '#1a1a3e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.background = '#1a1a2e';
                }}
              >
                <div>{loc.name}</div>
                <div style={{ 'font-size': '14px', color: '#888', 'margin-top': '4px' }}>{loc.address || 'Адрес не указан'}</div>
              </button>
            )}
          </For>
        </div>

        <p style={{ 'margin-top': '48px', 'font-size': '14px', color: '#555' }}>
          Нажмите F11 для полноэкранного режима
        </p>
      </div>
    );
  }

  const data = boardData();

  return (
    <div style={{
      'min-height': '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      color: '#fff',
      padding: '48px',
      'font-family': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      'box-sizing': 'border-box',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '48px' }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '24px' }}>
          <span style={{ 'font-size': '48px' }}>☕</span>
          <div>
            <h1 style={{ margin: 0, 'font-size': '36px', 'font-weight': '800' }}>
              {data?.location.name || 'Кофейня'}
            </h1>
            <Show when={data?.location.address}>
              <p style={{ margin: '4px 0 0', 'font-size': '16px', color: '#888' }}>{data?.location.address}</p>
            </Show>
          </div>
        </div>

        <div style={{ 'text-align': 'right' }}>
          <div style={{ 'font-size': '42px', 'font-weight': '700', 'font-variant-numeric': 'tabular-nums' }}>
            {currentTime().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', 'justify-content': 'flex-end', 'margin-top': '4px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              'border-radius': '50%',
              background: connected() ? '#00ff88' : '#ff4444',
            }} />
            <span style={{ 'font-size': '14px', color: '#888' }}>
              {connected() ? 'Онлайн' : 'Офлайн'}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '48px', height: 'calc(100vh - 200px)' }}>
        {/* Preparing section */}
        <div>
          <div style={{
            display: 'flex',
            'align-items': 'center',
            gap: '16px',
            'margin-bottom': '32px',
          }}>
            <span style={{ 'font-size': '36px' }}>⏳</span>
            <h2 style={{ margin: 0, 'font-size': '32px', 'font-weight': '700', color: '#ffa500' }}>
              ГОТОВИТСЯ
            </h2>
            <span style={{
              padding: '8px 16px',
              'border-radius': '20px',
              background: '#ffa50030',
              color: '#ffa500',
              'font-size': '20px',
              'font-weight': '600',
            }}>
              {data?.preparing.length || 0}
            </span>
          </div>

          <div style={{ display: 'grid', 'grid-template-columns': 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            <Show when={data?.preparing.length === 0}>
              <div style={{
                'grid-column': '1 / -1',
                'text-align': 'center',
                padding: '48px',
                color: '#555',
                'font-size': '18px',
              }}>
                Нет заказов в очереди
              </div>
            </Show>
            <For each={data?.preparing || []}>
              {(order) => (
                <div style={{
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '2px solid rgba(255, 165, 0, 0.3)',
                  'border-radius': '20px',
                  padding: '24px',
                  'text-align': 'center',
                }}>
                  <div style={{
                    'font-size': '48px',
                    'font-weight': '800',
                    color: '#ffa500',
                    'margin-bottom': '8px',
                  }}>
                    #{order.orderNumber}
                  </div>
                  <div style={{ 'font-size': '20px', color: '#ccc' }}>
                    {order.customerName}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Ready section */}
        <div>
          <div style={{
            display: 'flex',
            'align-items': 'center',
            gap: '16px',
            'margin-bottom': '32px',
          }}>
            <span style={{ 'font-size': '36px' }}>✅</span>
            <h2 style={{ margin: 0, 'font-size': '32px', 'font-weight': '700', color: '#00ff88' }}>
              ГОТОВО
            </h2>
            <span style={{
              padding: '8px 16px',
              'border-radius': '20px',
              background: '#00ff8830',
              color: '#00ff88',
              'font-size': '20px',
              'font-weight': '600',
            }}>
              {data?.ready.length || 0}
            </span>
          </div>

          <div style={{ display: 'grid', 'grid-template-columns': 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
            <Show when={data?.ready.length === 0}>
              <div style={{
                'grid-column': '1 / -1',
                'text-align': 'center',
                padding: '48px',
                color: '#555',
                'font-size': '18px',
              }}>
                Готовых заказов нет
              </div>
            </Show>
            <For each={data?.ready || []}>
              {(order) => {
                const isNew = newReadyOrder()?.id === order.id;
                return (
                  <div
                    style={{
                      background: isNew ? '#00ff88' : 'rgba(0, 255, 136, 0.15)',
                      border: '3px solid #00ff88',
                      'border-radius': '24px',
                      padding: '32px',
                      'text-align': 'center',
                      animation: isNew ? 'pulse 0.5s ease-in-out infinite alternate' : 'none',
                      'box-shadow': isNew ? '0 0 30px rgba(0, 255, 136, 0.5)' : 'none',
                    }}
                  >
                    <div style={{
                      'font-size': '64px',
                      'font-weight': '800',
                      color: isNew ? '#000' : '#00ff88',
                      'margin-bottom': '12px',
                    }}>
                      #{order.orderNumber}
                    </div>
                    <div style={{
                      'font-size': '24px',
                      color: isNew ? '#000' : '#fff',
                      'font-weight': '600',
                    }}>
                      {order.customerName}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '48px',
        right: '48px',
        display: 'flex',
        'justify-content': 'space-between',
        'align-items': 'center',
        color: '#555',
        'font-size': '14px',
      }}>
        <div>
          Выдано сегодня: <span style={{ color: '#00ff88', 'font-weight': '600' }}>{data?.stats.completedToday || 0}</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button
            onClick={() => setShowSelector(true)}
            style={{
              padding: '8px 16px',
              'border-radius': '8px',
              border: '1px solid #333',
              background: 'transparent',
              color: '#666',
              'font-size': '12px',
              cursor: 'pointer',
            }}
          >
            Сменить точку
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          from {
            transform: scale(1);
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
          }
          to {
            transform: scale(1.03);
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.8);
          }
        }
      `}</style>
    </div>
  );
}

