// FoodWise AI: Enterprise Waste Registry & History
// Real enterprise table: Dense rows, comprehensive filtering, pagination, drawer details

import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  Camera
} from 'lucide-react';
import { WasteRecord } from '../types.ts';
import { Badge } from './ui/Badge.tsx';

interface WasteHistoryViewProps {
  onScanNewTray: () => void;
}

export const WasteHistoryView: React.FC<WasteHistoryViewProps> = ({ onScanNewTray }) => {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterShift, setFilterShift] = useState<string>('All');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterType, setFilterType] = useState<'All' | 'Verified' | 'Demo'>('All');
  const [selectedRecord, setSelectedRecord] = useState<WasteRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/waste-records?includeDemo=true');
      const json = await res.json();
      if (json.success) {
        setRecords(json.records);
      }
    } catch (err) {
      console.error('[History fetch error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesSearch =
      r.food_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.station_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesShift = filterShift === 'All' || r.service_shift === filterShift;
    const matchesLevel = filterLevel === 'All' || r.waste_level === filterLevel.toLowerCase();
    const matchesType =
      filterType === 'All' ||
      (filterType === 'Verified' && !r.is_demo) ||
      (filterType === 'Demo' && r.is_demo);

    return matchesSearch && matchesShift && matchesLevel && matchesType;
  });

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const exportCsv = () => {
    const headers = [
      'ID',
      'Food Name',
      'Quantity (kg)',
      'Waste Level',
      'Shift',
      'Station',
      'Data Classification',
      'Created At'
    ];
    const rows = filteredRecords.map(r => [
      r.id,
      `"${r.food_name}"`,
      r.user_confirmed_quantity,
      r.waste_level,
      r.service_shift,
      `"${r.station_name}"`,
      r.is_demo ? 'DEMO' : 'VERIFIED',
      `"${r.created_at}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `foodwise_waste_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E2]">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#171717] tracking-tight">
            Waste Records
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Audit log of physical scale weigh-ins and verified kitchen tray residue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-[#E5E5E2] bg-white text-[#171717] hover:bg-[#F2F2EF] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#666666]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onScanNewTray}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Record waste</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search item, station..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded pl-8 pr-2.5 py-1.5 text-xs text-[#171717] placeholder-[#888888] outline-none"
            />
          </div>

          {/* Meal Shift Filter */}
          <select
            value={filterShift}
            onChange={e => {
              setFilterShift(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
          >
            <option value="All">All Shifts</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
          </select>

          {/* Waste Level Filter */}
          <select
            value={filterLevel}
            onChange={e => {
              setFilterLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
          >
            <option value="All">All Levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Classification */}
          <select
            value={filterType}
            onChange={e => {
              setFilterType(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
          >
            <option value="All">All Data</option>
            <option value="Verified">Verified Only</option>
            <option value="Demo">Demo Baseline</option>
          </select>
        </div>

        <div className="text-xs font-mono text-[#666666]">
          {filteredRecords.length} records found
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E2] bg-[#F7F7F5] text-[11px] font-semibold text-[#666666] uppercase tracking-wider">
                <th className="py-2.5 px-4">Date / Time</th>
                <th className="py-2.5 px-4">Meal</th>
                <th className="py-2.5 px-4">Food Item</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4 text-center">Level</th>
                <th className="py-2.5 px-4">Source / Station</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAE7] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#777777]">
                    Loading records…
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#666666]">
                    <p className="font-medium text-[#171717] mb-1">No waste records yet</p>
                    <p className="text-xs text-[#666666] mb-3">
                      Food waste records will appear here after your kitchen completes its first scan.
                    </p>
                    <button
                      onClick={onScanNewTray}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] text-white"
                    >
                      Record waste
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(record => (
                  <tr
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[#555555]">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#171717]">
                      {record.service_shift}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#171717]">
                      {record.food_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#171717]">
                      {record.user_confirmed_quantity.toFixed(1)} {record.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          record.waste_level === 'high'
                            ? 'danger'
                            : record.waste_level === 'medium'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {record.waste_level.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#555555] truncate max-w-[180px]">
                      {record.station_name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {record.is_demo ? (
                        <Badge variant="demo">DEMO</Badge>
                      ) : (
                        <Badge variant="verified">VERIFIED</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="px-4 py-3 border-t border-[#E5E5E2] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#666666]">
          <span>
            Showing {filteredRecords.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
            {Math.min(currentPage * rowsPerPage, filteredRecords.length)} of {filteredRecords.length} records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-[#E5E5E2] bg-white disabled:opacity-40 hover:bg-[#F2F2EF]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-[#E5E5E2] bg-white disabled:opacity-40 hover:bg-[#F2F2EF]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Slide-Over Details Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-[#E5E5E2] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#171717]">Waste Record Detail</h3>
                  <p className="text-xs font-mono text-[#666666]">{selectedRecord.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 rounded text-[#666666] hover:bg-[#F0F0EE]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                    Food Item
                  </label>
                  <p className="text-sm font-medium text-[#171717]">{selectedRecord.food_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Confirmed Scale Weight
                    </label>
                    <p className="text-lg font-mono font-semibold text-[#171717]">
                      {selectedRecord.user_confirmed_quantity.toFixed(1)} {selectedRecord.unit}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Waste Level
                    </label>
                    <Badge
                      variant={
                        selectedRecord.waste_level === 'high'
                          ? 'danger'
                          : selectedRecord.waste_level === 'medium'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {selectedRecord.waste_level.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Service Shift
                    </label>
                    <p className="text-[#171717]">{selectedRecord.service_shift}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Scale Station
                    </label>
                    <p className="text-[#171717]">{selectedRecord.station_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                    Logged Timestamp
                  </label>
                  <p className="font-mono text-[#171717]">{selectedRecord.created_at}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                    Data Classification
                  </label>
                  {selectedRecord.is_demo ? (
                    <Badge variant="demo">DEMO BASELINE RECORD</Badge>
                  ) : (
                    <Badge variant="verified">HUMAN-VERIFIED SCALE ENTRY</Badge>
                  )}
                </div>

                {selectedRecord.notes && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Notes / Observations
                    </label>
                    <p className="bg-[#F7F7F5] border border-[#E5E5E2] rounded p-2 text-[#444444] leading-relaxed">
                      {selectedRecord.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-[#E5E5E2] bg-[#FAFAFA] flex items-center justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-3 py-1.5 rounded text-xs font-medium border border-[#E5E5E2] bg-white text-[#171717] hover:bg-[#F2F2EF]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
