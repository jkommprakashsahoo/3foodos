import React from 'react';
import { MapPin } from 'lucide-react';
import type { Receiver } from '../types.ts';

interface InteractiveMapProps {
  receivers: Receiver[];
  selectedReceiverId: string | null;
  onSelectReceiver: (id: string) => void;
  kitchenName?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  receivers,
  selectedReceiverId,
  onSelectReceiver,
  kitchenName
}) => (
  <section className="rounded-lg border border-[#e2e6e1] bg-[#f7f8f6] p-4" aria-label="Route information">
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#e2e6e1] bg-white">
        <MapPin className="h-4 w-4 text-[#536359]" />
      </span>
      <div>
        <h3 className="text-sm font-medium">Route preview unavailable</h3>
        <p className="mt-1 text-xs leading-5 text-[#68736a]">
          {kitchenName ? `Pickup: ${kitchenName}. ` : ''}
          Add verified kitchen and receiver coordinates to enable distance and route estimates. No live GPS is available.
        </p>
      </div>
    </div>
    {receivers.length > 0 && (
      <div className="mt-4 border-t border-[#e2e6e1] pt-3">
        <p className="mb-2 text-xs font-medium text-[#68736a]">Receivers</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {receivers.map(receiver => (
            <li key={receiver.id}>
              <button
                type="button"
                aria-pressed={receiver.id === selectedReceiverId}
                onClick={() => onSelectReceiver(receiver.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315a3a] ${
                  receiver.id === selectedReceiverId ? 'border-[#8aa18d] bg-white font-medium' : 'border-[#e2e6e1] bg-white hover:bg-[#f7f8f6]'
                }`}
              >
                {receiver.name}
                <span className="mt-0.5 block text-xs font-normal text-[#68736a]">Capacity and availability are subject to receiver confirmation</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}
  </section>
);
