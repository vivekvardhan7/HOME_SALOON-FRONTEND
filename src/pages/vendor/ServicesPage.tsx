import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Plus,
    Edit,
    Trash2,
    Clock,
    DollarSign,
    AlertCircle,
    CheckCircle,
    Scissors
} from 'lucide-react';
import { toast } from 'sonner';

interface Service {
    id: string;
    name: string;
    category: string;
    category_id?: string;
    price: number;
    duration: number;
    description: string;
    isActive: boolean;
    imageUrl?: string;
    image_url?: string;
}

const ServicesPage = () => {
    const { t } = useTranslation();
    const { user } = useSupabaseAuth();
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServices();
    }, [user]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            if (!user?.id) return;

            const response = await api.get<{ services: Service[] }>(`/vendor/${user.id}/services`);
            if (response.data.services) {
                setServices(response.data.services);
            }
        } catch (error) {
            console.error('Error loading services:', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;

        try {
            if (!user?.id) return;
            await api.delete(`/vendor/${user.id}/services/${serviceId}`);
            toast.success('Service deleted');
            fetchServices();
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Failed to delete service');
        }
    };

    const getCategoryImage = (category: string) => {
        // Return placeholder or specific image based on category
        // For now, returning null to fall back to service image
        return null;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-[#4e342e]">Loading services...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">My Services</h1>
                        <p className="text-[#6d4c41]">Manage your service offerings</p>
                    </div>
                    <Button
                        onClick={() => navigate('/vendor/services/add')}
                        className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Service
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-md">
                            <div className="h-48 overflow-hidden bg-gray-100 relative">
                                {service.imageUrl || service.image_url ? (
                                    <img
                                        src={service.imageUrl || service.image_url}
                                        alt={service.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#fdf6f0]">
                                        <Scissors className="w-12 h-12 text-[#4e342e] opacity-20" />
                                    </div>
                                )}
                                <Badge
                                    className={`absolute top-3 right-3 ${service.isActive ? 'bg-green-500' : 'bg-gray-500'}`}
                                >
                                    {service.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>

                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-serif font-bold text-lg text-[#4e342e]">{service.name}</h3>
                                        <p className="text-sm text-[#6d4c41]">{service.category}</p>
                                    </div>
                                    <div className="font-semibold text-[#4e342e]">
                                        CD {service.price.toLocaleString()}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                                    {service.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center gap-2 text-sm text-[#6d4c41] mb-4">
                                    <Clock className="w-4 h-4" />
                                    <span>{service.duration} mins</span>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/vendor/services/edit/${service.id}`)}
                                        className="text-[#4e342e] hover:text-[#3b2c26] hover:bg-[#fdf6f0]"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteService(service.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {services.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-[#4e342e]">
                            <Scissors className="w-12 h-12 text-[#4e342e] mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-[#4e342e] mb-2">No services yet</h3>
                            <p className="text-[#6d4c41] mb-4">Start by adding your first service</p>
                            <Button
                                onClick={() => navigate('/vendor/services/add')}
                                variant="outline"
                                className="border-[#4e342e] text-[#4e342e]"
                            >
                                Add Service
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ServicesPage;
