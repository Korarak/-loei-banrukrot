import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, User, Mail, Phone, Lock, MapPin, Plus, Trash2, Home } from 'lucide-react';
import {
    useCreateCustomer,
    useUpdateCustomer,
    useCustomerAddresses,
    useAddAddress,
    useUpdateAddress,
    useDeleteAddress,
    type Customer,
    type CustomerAddress
} from '@/hooks/useCustomers';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const customerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    isActive: z.boolean(),
});

const addressSchema = z.object({
    addressLabel: z.string().optional(),
    recipientName: z.string().min(2, 'Recipient name is required'),
    streetAddress: z.string().min(5, 'Street address is required'),
    subDistrict: z.string().optional(),
    district: z.string().min(2, 'District is required'),
    province: z.string().min(2, 'Province is required'),
    zipCode: z.string().min(5, 'Zip code is required'),
    isDefault: z.boolean(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

interface CustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
}

export default function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
    const [activeTab, setActiveTab] = useState('details');
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
    const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);

    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();

    // Address hooks
    const { data: addresses, isLoading: isLoadingAddresses } = useCustomerAddresses(customer?._id);
    const addAddress = useAddAddress();
    const updateAddress = useUpdateAddress();
    const deleteAddress = useDeleteAddress();

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            isActive: true,
        },
    });

    const addressForm = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            addressLabel: '',
            recipientName: '',
            streetAddress: '',
            subDistrict: '',
            district: '',
            province: '',
            zipCode: '',
            isDefault: false,
        },
    });

    useEffect(() => {
        if (customer) {
            form.reset({
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone || '',
                password: '',
                isActive: customer.isActive,
            });
        } else {
            form.reset({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: '',
                isActive: true,
            });
            setActiveTab('details');
        }
    }, [customer, form, open]);

    useEffect(() => {
        if (editingAddress) {
            addressForm.reset({
                addressLabel: editingAddress.addressLabel || '',
                recipientName: editingAddress.recipientName,
                streetAddress: editingAddress.streetAddress,
                subDistrict: editingAddress.subDistrict || '',
                district: editingAddress.district,
                province: editingAddress.province,
                zipCode: editingAddress.zipCode,
                isDefault: editingAddress.isDefault,
            });
            setIsAddressFormOpen(true);
        } else {
            addressForm.reset({
                addressLabel: '',
                recipientName: '',
                streetAddress: '',
                subDistrict: '',
                district: '',
                province: '',
                zipCode: '',
                isDefault: false,
            });
        }
    }, [editingAddress, addressForm]);

    const onSubmit = async (values: CustomerFormValues) => {
        try {
            if (customer) {
                const updateData: any = { ...values };
                if (!updateData.password) delete updateData.password;

                await updateCustomer.mutateAsync({
                    id: customer._id,
                    data: updateData,
                });
                toast.success('Customer updated successfully');
            } else {
                if (!values.password) {
                    form.setError('password', { message: 'Password is required for new customers' });
                    return;
                }
                await createCustomer.mutateAsync(values as any);
                toast.success('Customer created successfully');
            }
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save customer');
        }
    };

    const onAddressSubmit = async (values: AddressFormValues) => {
        if (!customer) return;

        try {
            if (editingAddress) {
                await updateAddress.mutateAsync({
                    customerId: customer._id,
                    addressId: editingAddress._id,
                    data: values,
                });
                toast.success('Address updated successfully');
            } else {
                await addAddress.mutateAsync({
                    customerId: customer._id,
                    data: values,
                });
                toast.success('Address added successfully');
            }
            setIsAddressFormOpen(false);
            setEditingAddress(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save address');
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!customer) return;
        try {
            await deleteAddress.mutateAsync({ addressId, customerId: customer._id });
            toast.success('Address deleted successfully');
        } catch (error) {
            toast.error('Failed to delete address');
        }
    };

    const isLoading = createCustomer.isPending || updateCustomer.isPending;
    const isAddressLoading = addAddress.isPending || updateAddress.isPending || deleteAddress.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] rounded-3xl border-none shadow-2xl bg-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-8 pt-8 pb-6 bg-white border-b border-gray-50 flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {customer ? (
                                <>
                                    <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Edit Customer
                                </>
                            ) : (
                                <>
                                    <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-green-600" />
                                    </div>
                                    Add New Customer
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 text-base mt-1">
                            {customer
                                ? "Manage customer details and addresses."
                                : "Create a new customer account."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-8 pt-4">
                            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-gray-100 rounded-xl">
                                <TabsTrigger
                                    value="details"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                                >
                                    Personal Details
                                </TabsTrigger>
                                <TabsTrigger
                                    value="addresses"
                                    disabled={!customer}
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all disabled:opacity-50"
                                >
                                    Addresses {addresses && addresses.length > 0 && `(${addresses.length})`}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="details" className="mt-0">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 py-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 font-medium">First Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input placeholder="John" {...field} className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 font-medium">Last Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input placeholder="Doe" {...field} className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input placeholder="john@example.com" {...field} className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-gray-700 font-medium">Phone Number</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input placeholder="+1 (555) 000-0000" {...field} className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium">
                                                    {customer ? 'New Password (Optional)' : 'Password'}
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            type="password"
                                                            placeholder={customer ? "Leave blank to keep current" : "Create a secure password"}
                                                            {...field}
                                                            className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base font-medium text-gray-900">Active Account</FormLabel>
                                                    <FormDescription className="text-gray-500">
                                                        Allow this customer to log in and make purchases
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="data-[state=checked]:bg-green-600"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-4 flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => onOpenChange(false)}
                                            className="rounded-xl border-gray-200 h-11 px-6 hover:bg-gray-50 hover:text-black"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="rounded-xl bg-black hover:bg-gray-800 text-white h-11 px-6 shadow-lg shadow-gray-200"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save Customer'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="addresses" className="mt-0 px-8 py-6">
                            {isAddressFormOpen ? (
                                <Form {...addressForm}>
                                    <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                                            </h3>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsAddressFormOpen(false);
                                                    setEditingAddress(null);
                                                }}
                                                className="text-gray-500 hover:text-black"
                                            >
                                                Cancel
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={addressForm.control}
                                                name="addressLabel"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Label (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Home, Office, etc." {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={addressForm.control}
                                                name="recipientName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Recipient Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="John Doe" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={addressForm.control}
                                            name="streetAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Street Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="123 Main St" {...field} className="rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={addressForm.control}
                                                name="subDistrict"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Sub-district</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Sub-district" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={addressForm.control}
                                                name="district"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>District</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="District" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={addressForm.control}
                                                name="province"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Province</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Province" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={addressForm.control}
                                                name="zipCode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Zip Code</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="10000" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={addressForm.control}
                                            name="isDefault"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base font-medium text-gray-900">Default Address</FormLabel>
                                                        <FormDescription className="text-gray-500">
                                                            Use this as the primary shipping address
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-blue-600"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <div className="pt-2 flex justify-end gap-3">
                                            <Button
                                                type="submit"
                                                disabled={isAddressLoading}
                                                className="rounded-xl bg-black hover:bg-gray-800 text-white h-11 px-6 shadow-lg shadow-gray-200"
                                            >
                                                {isAddressLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save Address'
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Saved Addresses</h3>
                                        <Button
                                            onClick={() => setIsAddressFormOpen(true)}
                                            className="rounded-xl bg-black text-white hover:bg-gray-800"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Address
                                        </Button>
                                    </div>

                                    {isLoadingAddresses ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                                        </div>
                                    ) : addresses && addresses.length > 0 ? (
                                        <div className="grid gap-4">
                                            {addresses.map((addr) => (
                                                <div
                                                    key={addr._id}
                                                    className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow group relative"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <MapPin className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-900">{addr.addressLabel || 'Address'}</span>
                                                                    {addr.isDefault && (
                                                                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">Default</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-900 mt-1">{addr.recipientName}</p>
                                                                <p className="text-sm text-gray-500 mt-1">
                                                                    {addr.streetAddress}<br />
                                                                    {addr.subDistrict ? `${addr.subDistrict}, ` : ''}{addr.district}<br />
                                                                    {addr.province}, {addr.zipCode}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setEditingAddress(addr)}
                                                                className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black"
                                                            >
                                                                <Plus className="h-4 w-4 rotate-45" /> {/* Using Plus as Edit icon since Pencil isn't imported, or just import Pencil */}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteAddress(addr._id)}
                                                                className="h-8 w-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                <Home className="h-6 w-6 text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No addresses found</p>
                                            <p className="text-gray-400 text-sm mt-1">Add an address for shipping and billing</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
