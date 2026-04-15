import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabaseClient';
import { Card } from '../components/ui/Card';
import { MapPin, Navigation, Package, Truck, Route } from 'lucide-react';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const origemIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const destinoIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;background:#22c55e;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const geocode = async (location: string): Promise<[number, number] | null> => {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Brasil')}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'pt-BR' } }
    );
    const data = await resp.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch {
    return null;
  }
};

const getOSRMRoute = async (origin: [number, number], dest: [number, number]): Promise<[number, number][]> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates as [number, number][];
      return coords.map(([lng, lat]) => [lat, lng]);
    }
  } catch {}
  return [origin, dest];
};

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [coords, map]);
  return null;
}

export const MapaRota = () => {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [selectedOrdem, setSelectedOrdem] = useState<any | null>(null);
  const [origemCoord, setOrigemCoord] = useState<[number, number] | null>(null);
  const [destinoCoord, setDestinoCoord] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('ordens_servico')
        .select('*, empresa:empresas(*), motorista:motoristas(*), veiculo:veiculos(*)')
        .order('created_at', { ascending: false });
      setOrdens(data || []);
      if (data && data.length > 0) {
        setSelectedOrdem(data[0]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedOrdem) return;
    const resolve = async () => {
      setLoading(true);
      setGeocodeError('');
      setRouteCoords([]);
      setOrigemCoord(null);
      setDestinoCoord(null);
      setDistanceKm(null);

      const [orig, dest] = await Promise.all([
        geocode(selectedOrdem.origem),
        geocode(selectedOrdem.destino),
      ]);

      if (!orig || !dest) {
        setGeocodeError('Não foi possível geocodificar a origem ou destino. Verifique os endereços.');
        setLoading(false);
        return;
      }

      setOrigemCoord(orig);
      setDestinoCoord(dest);

      const route = await getOSRMRoute(orig, dest);
      setRouteCoords(route);

      // Estimate distance
      if (route.length >= 2) {
        let total = 0;
        for (let i = 1; i < route.length; i++) {
          total += L.latLng(route[i - 1]).distanceTo(L.latLng(route[i]));
        }
        setDistanceKm(Math.round(total / 1000));
      }

      setLoading(false);
    };
    resolve();
  }, [selectedOrdem]);

  const statusColor: Record<string, string> = {
    pendente: 'bg-yellow-500/20 text-yellow-500',
    em_andamento: 'bg-blue-500/20 text-blue-500',
    concluido: 'bg-green-500/20 text-green-500',
    cancelado: 'bg-red-500/20 text-red-500',
  };

  const defaultCenter: [number, number] = [-15.8, -47.9];

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Route size={24} className="text-primary" />
            Mapa de Rotas
          </h1>
          <p className="text-text-muted">Visualize a rota de cada ordem de serviço no mapa.</p>
        </div>

        <div className="w-full sm:w-80">
          <select
            className="w-full bg-surface border border-border rounded-md px-4 py-2 text-sm text-white"
            value={selectedOrdem?.id || ''}
            onChange={(e) => {
              const found = ordens.find(o => o.id === e.target.value);
              setSelectedOrdem(found || null);
            }}
          >
            {ordens.map(o => (
              <option key={o.id} value={o.id}>
                {o.numero_os || o.id.slice(0, 8)} — {o.origem} → {o.destino}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info cards */}
      {selectedOrdem && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="flex items-start gap-3 !py-3 !px-4">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500 mt-0.5"><MapPin size={16} /></div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">Origem</p>
              <p className="text-sm text-white font-medium">{selectedOrdem.origem}</p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 !py-3 !px-4">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500 mt-0.5"><Navigation size={16} /></div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">Destino</p>
              <p className="text-sm text-white font-medium">{selectedOrdem.destino}</p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 !py-3 !px-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 mt-0.5"><Truck size={16} /></div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">Motorista</p>
              <p className="text-sm text-white font-medium">{selectedOrdem.motorista?.nome || '—'}</p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 !py-3 !px-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5"><Package size={16} /></div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold">Status</p>
              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-bold mt-0.5 ${statusColor[selectedOrdem.status] || 'bg-border/50 text-text-muted'}`}>
                {selectedOrdem.status?.replace('_', ' ')}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Map */}
      <div className="!p-0 overflow-hidden relative rounded-xl border border-border" style={{ height: '520px' }}>
        {loading && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-text-muted text-sm">Geocodificando rota...</p>
          </div>
        )}

        {geocodeError && !loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-surface/80 backdrop-blur-sm p-6">
            <div className="text-center max-w-sm">
              <MapPin size={40} className="text-red-500 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Endereço não encontrado</p>
              <p className="text-text-muted text-sm">{geocodeError}</p>
            </div>
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {origemCoord && (
            <Marker position={origemCoord} icon={origemIcon}>
              <Popup>
                <div className="text-sm font-semibold">📍 Origem</div>
                <div className="text-xs">{selectedOrdem?.origem}</div>
              </Popup>
            </Marker>
          )}

          {destinoCoord && (
            <Marker position={destinoCoord} icon={destinoIcon}>
              <Popup>
                <div className="text-sm font-semibold">🏁 Destino</div>
                <div className="text-xs">{selectedOrdem?.destino}</div>
              </Popup>
            </Marker>
          )}

          {routeCoords.length >= 2 && (
            <>
              <Polyline
                positions={routeCoords}
                pathOptions={{ color: '#ef4444', weight: 5, opacity: 0.85, dashArray: undefined, lineCap: 'round', lineJoin: 'round' }}
              />
              <FitBounds coords={routeCoords} />
            </>
          )}
        </MapContainer>

        {/* Distance badge */}
        {distanceKm !== null && !loading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-surface border border-border rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg text-sm font-semibold text-white">
            <Route size={14} className="text-primary" />
            Distância estimada: ~{distanceKm.toLocaleString('pt-BR')} km
          </div>
        )}
      </div>
    </div>
  );
};
