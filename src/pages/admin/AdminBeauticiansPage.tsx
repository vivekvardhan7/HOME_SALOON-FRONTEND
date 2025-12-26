
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
    UserCheck,
    Search,
    Plus,
    Trash2,
    Mail,
    Phone,
    Sparkles,
    MapPin,
    Star,
    CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Beautician {
    id: string;
    name: string;
    email: string;
    phone: string;
    skills: string;
    expert_level: string;
    status: string;
    location?: string;
    created_at: string;
    completed_services_count?: number;
}

const AdminBeauticiansPage = () => {
    const [beauticians, setBeauticians] = useState<Beautician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newBeautician, setNewBeautician] = useState({
        name: '',
        email: '',
        phone: '',
        skills: '', // e.g. "Hair Cut, Facial"
        expert_level: 'Intermediate',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit State
    const [editingBeautician, setEditingBeautician] = useState<Beautician | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        fetchBeauticians();
    }, []);

    const fetchBeauticians = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/beauticians');
            // @ts-ignore
            if (response.data?.success) {
                // @ts-ignore
                setBeauticians(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching beauticians:', error);
            toast.error('Failed to load beauticians');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBeautician = async () => {
        try {
            if (!newBeautician.name || !newBeautician.phone) {
                toast.error('Name and Phone are required');
                return;
            }

            setIsSubmitting(true);
            const response = await api.post('/admin/beauticians', newBeautician);

            // @ts-ignore
            if (response.data?.success) {
                toast.success('Beautician added successfully');
                setIsAddOpen(false);
                setNewBeautician({ name: '', email: '', phone: '', skills: '', expert_level: 'Intermediate' });
                fetchBeauticians();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add beautician');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBeautician = async () => {
        if (!editingBeautician) return;
        try {
            setIsSubmitting(true);
            const response = await api.put(`/admin/beauticians/${editingBeautician.id}`, {
                name: editingBeautician.name,
                email: editingBeautician.email,
                phone: editingBeautician.phone,
                skills: editingBeautician.skills,
                expert_level: editingBeautician.expert_level
            });

            // @ts-ignore
            if (response.data?.success) {
                toast.success('Beautician updated successfully');
                setIsEditOpen(false);
                setEditingBeautician(null);
                fetchBeauticians();
            }
        } catch (error: any) {
            toast.error('Failed to update beautician');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const response = await api.put(`/admin/beauticians/${id}`, { status: newStatus });
            // @ts-ignore
            if (response.data?.success) {
                toast.success(`Status updated to ${newStatus}`);
                fetchBeauticians();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const openEditModal = (b: Beautician) => {
        setEditingBeautician(b);
        setIsEditOpen(true);
    };

    const handleDelete = async (id: string) => {
        // Confirm logic could be added here
        if (!confirm("Are you sure you want to remove this beautician?")) return;

        try {
            const response = await api.delete(`/admin/beauticians/${id}`);
            // @ts-ignore
            if (response.data?.success) {
                toast.success('Beautician removed');
                fetchBeauticians();
            }
        } catch (error) {
            toast.error('Failed to remove beautician');
        }
    };

    const filtered = beauticians.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof b.skills === 'string'
            ? b.skills.toLowerCase().includes(searchTerm.toLowerCase())
            : Array.isArray(b.skills)
                ? (b.skills as string[]).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
                : false
        )
    );

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">Beautician Management</h1>
                            <p className="text-[#6d4c41]">Manage your fleet of At-Home beauticians</p>
                        </div>
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-[#4e342e] hover:bg-[#6d4c41] text-white mt-4 sm:mt-0"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Beautician
                        </Button>
                    </div>

                    <Card className="border-0 bg-white shadow-lg mb-6">
                        <CardContent className="p-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-4 h-4" />
                                <Input
                                    placeholder="Search by name or skills..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 border-[#f8d7da] focus:border-[#4e342e]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {loading ? (
                        <div className="text-center py-10">Loading beauticians...</div>
                    ) : filtered.length === 0 ? (
                        <Card className="border-0 bg-white shadow-sm p-10 text-center">
                            <p className="text-muted-foreground">No beauticians found. Add one to get started.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((beautician) => (
                                <Card key={beautician.id} className="border-0 bg-white shadow-lg hover:shadow-xl transition-all relative overflow-hidden">
                                    {beautician.status === 'FROZEN' && <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-3 py-1 font-bold z-10">FROZEN</div>}
                                    {beautician.status === 'INACTIVE' && <div className="absolute top-0 right-0 bg-gray-500 text-white text-xs px-3 py-1 font-bold z-10">INACTIVE</div>}

                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-[#f8d7da] flex items-center justify-center text-[#4e342e] font-bold text-xl">
                                                    {beautician.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-[#4e342e]">{beautician.name}</h3>
                                                    <Badge variant="secondary" className="text-xs">{beautician.expert_level}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm text-[#6d4c41] mb-4">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" /> {beautician.phone || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> {beautician.email || 'N/A'}
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Sparkles className="w-4 h-4 mt-0.5" />
                                                <span className="italic">
                                                    {Array.isArray(beautician.skills) ? beautician.skills.join(', ') : beautician.skills || 'No specific skills'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 font-medium text-green-700">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>{beautician.completed_services_count || 0} Services Completed</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 flex-wrap gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${beautician.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                                {beautician.status}
                                            </span>

                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEditModal(beautician)}>
                                                    Edit
                                                </Button>

                                                {beautician.status !== 'ACTIVE' ? (
                                                    <Button variant="outline" size="sm" className="h-7 text-xs bg-green-50 text-green-600 hover:bg-green-100 border-green-200" onClick={() => handleStatusChange(beautician.id, 'ACTIVE')}>
                                                        Activate
                                                    </Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" className="h-7 text-xs text-gray-500 hover:text-gray-700" onClick={() => handleStatusChange(beautician.id, 'INACTIVE')}>
                                                        Deactivate
                                                    </Button>
                                                )}

                                                {beautician.status !== 'FROZEN' ? (
                                                    <Button variant="outline" size="sm" className="h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleStatusChange(beautician.id, 'FROZEN')}>
                                                        Freeze
                                                    </Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" className="h-7 text-xs text-blue-500 hover:bg-blue-50 hover:text-blue-700 border-blue-200" onClick={() => handleStatusChange(beautician.id, 'ACTIVE')}>
                                                        Unfreeze
                                                    </Button>
                                                )}

                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-300 hover:text-red-600" onClick={() => handleDelete(beautician.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Add Modal */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Beautician</DialogTitle>
                            <DialogDescription>
                                Enter details to add a new qualified beautician to the platform.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={newBeautician.name}
                                    onChange={e => setNewBeautician({ ...newBeautician, name: e.target.value })}
                                    placeholder="e.g. Sarah Jones"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={newBeautician.phone}
                                        onChange={e => setNewBeautician({ ...newBeautician, phone: e.target.value })}
                                        placeholder="+243..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email (Optional)</Label>
                                    <Input
                                        value={newBeautician.email}
                                        onChange={e => setNewBeautician({ ...newBeautician, email: e.target.value })}
                                        placeholder="sarah@example.com"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Expert Level</Label>
                                <Select
                                    value={newBeautician.expert_level}
                                    onValueChange={v => setNewBeautician({ ...newBeautician, expert_level: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Junior">Junior (Starter)</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Senior">Senior (Expert)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Skills (Comma Separated)</Label>
                                <Textarea
                                    value={newBeautician.skills}
                                    onChange={e => setNewBeautician({ ...newBeautician, skills: e.target.value })}
                                    placeholder="Hair Cut, Massage, Facial, Makeup..."
                                />
                                <p className="text-xs text-muted-foreground">Used for matching with customer bookings.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleAddBeautician}
                                disabled={isSubmitting}
                                className="bg-[#4e342e] text-white"
                            >
                                {isSubmitting ? 'Adding...' : 'Add Beautician'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* EDIT MODAL */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Beautician</DialogTitle>
                        </DialogHeader>
                        {editingBeautician && (
                            <div className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={editingBeautician.name}
                                        onChange={e => setEditingBeautician({ ...editingBeautician, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={editingBeautician.phone}
                                            onChange={e => setEditingBeautician({ ...editingBeautician, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Email</Label>
                                        <Input
                                            value={editingBeautician.email}
                                            onChange={e => setEditingBeautician({ ...editingBeautician, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Expert Level</Label>
                                    <Select
                                        value={editingBeautician.expert_level}
                                        onValueChange={v => setEditingBeautician({ ...editingBeautician, expert_level: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Junior">Junior (Starter)</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Senior">Senior (Expert)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Skills</Label>
                                    <Textarea
                                        value={Array.isArray(editingBeautician.skills) ? editingBeautician.skills.join(', ') : editingBeautician.skills}
                                        onChange={e => setEditingBeautician({ ...editingBeautician, skills: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleUpdateBeautician}
                                disabled={isSubmitting}
                                className="bg-[#4e342e] text-white"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div >
        </DashboardLayout >
    );
};

export default AdminBeauticiansPage;
