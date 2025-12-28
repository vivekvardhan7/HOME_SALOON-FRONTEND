import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import { Image as ImageIcon, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceForm {
    name: string;
    category: string;
    price: string;
    duration: string;
    description: string;
    image: File | null;
    imagePreview: string | null;
    gender: string;
}

const AddServicePage = () => {
    const { t } = useTranslation();
    const { user } = useSupabaseAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<ServiceForm>({
        name: '',
        category: '',
        price: '',
        duration: '60',
        description: '',
        image: null,
        imagePreview: null,
        gender: 'unisex'
    });

    const categories = [
        { value: 'hair_styling', label: 'Hair Styling' },
        { value: 'hair_coloring', label: 'Hair Coloring' },
        { value: 'skincare', label: 'Skincare' },
        { value: 'makeup', label: 'Makeup' },
        { value: 'nails', label: 'Nails' },
        { value: 'spa', label: 'Spa & Massage' },
        { value: 'barber', label: 'Barbering' }
    ];

    const handleInputChange = (field: keyof ServiceForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                toast.error('Image size must be less than 10MB');
                return;
            }

            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PNG, JPEG, and WebP images are allowed');
                return;
            }

            setForm(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.category || !form.price || !form.duration) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!form.image) {
            toast.error('Please upload a service image');
            return;
        }

        if (!user?.id) {
            toast.error('User not authenticated');
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('category', form.category); // Sending category name/value
            formData.append('price', form.price);
            formData.append('duration', form.duration);
            formData.append('description', form.description);
            formData.append('gender_preferences', form.gender);

            if (form.image) {
                formData.append('image', form.image);
            }

            console.log('📤 Submitting Service...', Object.fromEntries(formData));

            await api.post(`/vendor/${user.id}/services`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Service added successfully');
            navigate('/vendor/services');
        } catch (error: any) {
            console.error('Error creating service:', error);

            let errorMessage = 'Failed to create service';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error?.message) {
                errorMessage = error.response.data.error.message;
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8 px-4 max-w-3xl">
                <div className="mb-8 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/vendor/services')}
                        className="text-[#4e342e]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#4e342e]">
                            Add New Service
                        </h1>
                        <p className="text-[#6d4c41]">
                            Create a new service offering for your clients
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border border-[#fdf6f0]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-[#4e342e] font-medium">
                                    Service Name *
                                </Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="e.g. Luxury Facial"
                                    className="border-[#4e342e] text-[#4e342e] mt-2"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category" className="text-[#4e342e] font-medium">
                                        Category *
                                    </Label>
                                    <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)}>
                                        <SelectTrigger className="border-[#4e342e] text-[#4e342e] mt-2">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.value} value={category.value}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="gender" className="text-[#4e342e] font-medium">
                                        Gender Preference
                                    </Label>
                                    <Select value={form.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                                        <SelectTrigger className="border-[#4e342e] text-[#4e342e] mt-2">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unisex">Unisex</SelectItem>
                                            <SelectItem value="female">Female Only</SelectItem>
                                            <SelectItem value="male">Male Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price" className="text-[#4e342e] font-medium">
                                        Price ($) *
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => handleInputChange('price', e.target.value)}
                                        placeholder="0"
                                        className="border-[#4e342e] text-[#4e342e] mt-2"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="duration" className="text-[#4e342e] font-medium">
                                        Duration (minutes) *
                                    </Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={form.duration}
                                        onChange={(e) => handleInputChange('duration', e.target.value)}
                                        placeholder="60"
                                        className="border-[#4e342e] text-[#4e342e] mt-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-[#4e342e] font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Describe your service..."
                                    className="border-[#4e342e] text-[#4e342e] mt-2"
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <Label htmlFor="image" className="text-[#4e342e] font-medium">
                                Service Image *
                            </Label>
                            <div className="mt-2 flex items-center gap-4">
                                {form.imagePreview ? (
                                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#4e342e]">
                                        <img
                                            src={form.imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            type="button"
                                            className="absolute top-0 right-0 h-6 w-6 rounded-none rounded-bl-lg"
                                            onClick={() => setForm(prev => ({ ...prev, image: null, imagePreview: null }))}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-[#4e342e] flex items-center justify-center bg-[#fdf6f0]">
                                        <ImageIcon className="h-10 w-10 text-[#4e342e] opacity-50" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={handleImageChange}
                                        className="border-[#4e342e] text-[#4e342e] file:text-[#4e342e]"
                                    />
                                    <p className="text-xs text-[#6d4c41] mt-1">
                                        Max 10MB. PNG, JPEG, WebP, GIF allowed.
                                        High quality images increase booking rates.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/vendor/services')}
                                className="mr-3 border-[#4e342e] text-[#4e342e] hover:bg-[#fdf6f0]"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating Service...
                                    </>
                                ) : (
                                    'Create Service'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AddServicePage;
