import React, { useState } from 'react';
import { Building2, X, Trash2 } from 'lucide-react';

/**
 * BuildingModal Component to edit a existing building or add a new building
 */
const BuildingModal = ({
    isOpen,
    onClose,
    onSubmit,
    newBuilding,
    setNewBuilding,
    editingId,
    onDelete
}: any) => {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [confirmId, setConfirmId] = useState('');
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity flex items-center justify-center" />
            <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center select-none">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Building2 size={18} />
                        <span className="font-bold text-sm">{editingId ? 'Edit Building' : 'Register Building'}</span>
                    </div>
                    {/* close button */}
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Building Name</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g. North Wing"
                                value={newBuilding.name}
                                onChange={e => setNewBuilding({ ...newBuilding, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Address</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-black focus:ring-2 focus:ring-orange-500"
                                placeholder="123 Street Name"
                                value={newBuilding.address}
                                onChange={e => setNewBuilding({ ...newBuilding, address: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all mt-2">
                            {editingId ? 'Save Changes' : 'Confirm Registration'}
                        </button>

                    </form>

                    {editingId && (
                        <div className="pt-4 border-t border-gray-100">
                            {!showConfirmDelete ? (
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmDelete(true)}
                                    className="flex items-center justify-center gap-2 w-full py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
                                >
                                    <Trash2 size={16} /> Delete Building
                                </button>
                            ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <p className="text-[10px] font-bold text-red-600">TYPE ID TO CONFIRM <br />ID <span className="select-all bg-red-50 px-1">{editingId}</span></p>
                                    <input
                                        type="text"
                                        className="w-full p-2 bg-red-50 border border-red-100 rounded-lg outline-none text-sm"
                                        placeholder="Enter Building ID"
                                        value={confirmId}
                                        onChange={e => setConfirmId(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setShowConfirmDelete(false); setConfirmId(''); }}
                                            className="flex-1 py-2 text-gray-500 text-xs font-bold"
                                        >Cancel</button>
                                        <button
                                            disabled={confirmId !== editingId}
                                            onClick={() => { onDelete(); setShowConfirmDelete(false); setConfirmId(''); }}
                                            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                                        >Confirm Delete</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default BuildingModal;