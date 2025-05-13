'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle } from 'lucide-react';
import { AsyncSelect } from '@/components/ui/async-select';

// Zod schemas for each step
const personalSchema = z.object({
  language: z.string(),
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']),
  birth_date: z.date({ required_error: 'A date of birth is required.' }).nullable(),
  country: z.string().min(2),
  personal_code: z.string().min(1),
  tax_number: z.string().optional(),
  phone: z.string().optional(),
});

const addressSchema = z.object({
  country: z.string().min(2),
  street: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().min(1),
});

const paymentSchema = z.object({
  kind: z.enum(['sepa', 'swift']),
  currency: z.enum(['EUR', 'USD']),
  name: z.string().min(1),
  bank_name: z.string().min(1),
  iban: z.string().min(1),
});

const steps = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'address', label: 'Address' },
  { key: 'payment', label: 'Payment' },
  { key: 'proceed', label: 'Proceed' },
];

const LOCAL_STORAGE_KEY = 'onboardingFormData';

// Helper to get cache key per language
function getCountriesCacheKey(lang: string) {
  return `abillioCountries_${lang}`;
}

// Types for form data
interface PersonalFormData {
  language: string;
  email: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female' | 'other';
  birth_date: Date | null;
  country: string;
  personal_code: string;
  tax_number?: string;
  phone?: string;
}
interface AddressFormData {
  country: string;
  street: string;
  address2?: string;
  city: string;
  postcode: string;
}
interface PaymentFormData {
  kind: 'sepa' | 'swift';
  currency: 'EUR' | 'USD';
  name: string;
  bank_name: string;
  iban: string;
}
interface OnboardingFormData {
  personal?: PersonalFormData;
  address?: AddressFormData;
  payment?: PaymentFormData;
}

function saveToLocalStorage(data: OnboardingFormData) {
  // Convert birth_date to ISO string for storage
  const safeData = {
    ...data,
    personal: data.personal
      ? {
          ...data.personal,
          birth_date: data.personal.birth_date ? data.personal.birth_date.toISOString() : undefined,
        }
      : undefined,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeData));
}

function loadFromLocalStorage(): OnboardingFormData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Convert birth_date string back to Date
    if (parsed.personal && parsed.personal.birth_date) {
      parsed.personal.birth_date = new Date(parsed.personal.birth_date);
    }
    return parsed;
  } catch {
    return null;
  }
}

// Update fetchCountries to accept language
async function fetchCountries(
  lang: string,
): Promise<{ value: string; label: string; flag: string }[]> {
  const cacheKey = getCountriesCacheKey(lang);
  // 1. Try to load from localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Update in background
        updateCountriesInBackground(lang);
        return parsed;
      } catch {}
    }
  }
  // 2. If not cached, fetch from API and cache
  const fresh = await fetchAndCacheCountries(lang);
  return fresh;
}

async function fetchAndCacheCountries(lang: string) {
  const res = await fetch(`/api/abillio/countries?lang=${lang}`);
  const data = await res.json();
  const mapped = data.result.map((c: { id: string; name: string; flag: string }) => ({
    value: c.id,
    label: c.name,
    flag: c.flag,
  }));
  if (typeof window !== 'undefined') {
    localStorage.setItem(getCountriesCacheKey(lang), JSON.stringify(mapped));
  }
  return mapped;
}

function updateCountriesInBackground(lang: string) {
  fetchAndCacheCountries(lang);
}

// Klienta puses filtrs
const filterCountries = (option: { value: string; label: string; flag?: string }, query: string) =>
  option.label.toLowerCase().includes(query.toLowerCase()) ||
  option.value.toLowerCase().includes(query.toLowerCase());

export default function MultiStepOnboardingForm({ language }: { language: string }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [stepStatus, setStepStatus] = useState<{ [key: string]: 'done' | 'pending' }>({
    personal: 'pending',
    address: 'pending',
    payment: 'pending',
    proceed: 'pending',
  });
  const [formData, setFormData] = useState<OnboardingFormData>({});
  // Add open state for birth_date calendar popover
  const [birthDateOpen, setBirthDateOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const data = loadFromLocalStorage();
    if (data) setFormData(data);
  }, []);

  // Sync form values with formData (localStorage) for all forms
  useEffect(() => {
    if (formData.personal) {
      personalForm.reset({
        ...formData.personal,
        birth_date: formData.personal.birth_date ? new Date(formData.personal.birth_date) : null,
      });
    }
    if (formData.address) {
      addressForm.reset({
        ...formData.address,
      });
    }
    if (formData.payment) {
      paymentForm.reset({
        ...formData.payment,
      });
    }
  }, [formData]);

  // Step 1: Personal Info
  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      language,
      email: formData.personal?.email || '',
      first_name: formData.personal?.first_name || '',
      last_name: formData.personal?.last_name || '',
      gender: formData.personal?.gender || 'male',
      birth_date: formData.personal?.birth_date ? new Date(formData.personal.birth_date) : null,
      country: formData.personal?.country || '',
      personal_code: formData.personal?.personal_code || '',
      tax_number: formData.personal?.tax_number || '',
      phone: formData.personal?.phone || '',
    },
    mode: 'onTouched',
  });

  // Step 2: Address
  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: formData.address || {},
    mode: 'onTouched',
  });

  // Step 3: Payment
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: formData.payment || {},
    mode: 'onTouched',
  });

  // Handlers for each step
  function handlePersonalSubmit(values: PersonalFormData) {
    const newData = { ...formData, personal: values };
    setFormData(newData);
    saveToLocalStorage(newData);
    setStepStatus((prev) => ({ ...prev, personal: 'done' }));
    setActiveTab('address');
  }
  function handleAddressSubmit(values: AddressFormData) {
    const newData = { ...formData, address: values };
    setFormData(newData);
    saveToLocalStorage(newData);
    setStepStatus((prev) => ({ ...prev, address: 'done' }));
    setActiveTab('payment');
  }
  function handlePaymentSubmit(values: PaymentFormData) {
    const newData = { ...formData, payment: values };
    setFormData(newData);
    saveToLocalStorage(newData);
    setStepStatus((prev) => ({ ...prev, payment: 'done' }));
    setActiveTab('proceed');
  }
  function handleProceed() {
    // Here you would trigger verification or final submit
    setStepStatus((prev) => ({ ...prev, proceed: 'done' }));
    alert('Proceeding to verification!');
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          {steps.map((step) => (
            <TabsTrigger key={step.key} value={step.key}>
              {step.label}
              {stepStatus[step.key] === 'done' && (
                <CheckCircle className="inline text-green-500 w-4 h-4" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="personal">
          {/* Step 1: Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormProvider {...personalForm}>
                <Form {...personalForm}>
                  <form
                    onSubmit={personalForm.handleSubmit(handlePersonalSubmit)}
                    className="space-y-4"
                  >
                    <input type="hidden" {...personalForm.register('language')} value={language} />
                    <FormField
                      name="email"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="first_name"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="last_name"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="gender"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-col gap-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="male" id="gender-male" />
                                <label htmlFor="gender-male" className="text-sm">
                                  Male
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="female" id="gender-female" />
                                <label htmlFor="gender-female" className="text-sm">
                                  Female
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="gender-other" />
                                <label htmlFor="gender-other" className="text-sm">
                                  Other
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="birth_date"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground',
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                captionLayout="dropdown-buttons"
                                selected={field.value ?? undefined}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setBirthDateOpen(false);
                                }}
                                disabled={(date) =>
                                  date > new Date() || date < new Date('1900-01-01')
                                }
                                initialFocus
                                fromYear={1900}
                                toYear={new Date().getFullYear()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="country"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <AsyncSelect
                              fetcher={() => fetchCountries(language)}
                              preload
                              filterFn={filterCountries}
                              label="Country"
                              value={field.value}
                              onChange={field.onChange}
                              getOptionValue={(option: {
                                value: string;
                                label: string;
                                flag?: string;
                              }) => option.value}
                              getDisplayValue={(option: {
                                value: string;
                                label: string;
                                flag?: string;
                              }) => (
                                <span>
                                  {option.flag ? `${option.flag} ` : ''}
                                  {option.label}
                                </span>
                              )}
                              renderOption={(option: {
                                value: string;
                                label: string;
                                flag?: string;
                              }) => (
                                <span>
                                  {option.flag ? `${option.flag} ` : ''}
                                  {option.label}
                                </span>
                              )}
                              placeholder="Select country..."
                              width="100%"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="personal_code"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="tax_number"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Number (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="phone"
                      control={personalForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Continue
                    </Button>
                  </form>
                </Form>
              </FormProvider>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="address">
          {/* Step 2: Address */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Address</CardTitle>
            </CardHeader>
            <CardContent>
              <FormProvider {...addressForm}>
                <Form {...addressForm}>
                  <form
                    onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      name="country"
                      control={addressForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <AsyncSelect
                              fetcher={() => fetchCountries(language)}
                              preload
                              filterFn={filterCountries}
                              label="Country"
                              value={field.value}
                              onChange={field.onChange}
                              getOptionValue={(option: {
                                value: string;
                                label: string;
                                flag?: string;
                              }) => option.value}
                              getDisplayValue={(option: {
                                value: string;
                                label: string;
                                flag?: string;
                              }) => (
                                <span>
                                  {option.flag ? `${option.flag} ` : ''}
                                  {option.label}
                                </span>
                              )}
                              renderOption={(option: {
                                value: string;
                                label: string;
                                flag?: string;
                              }) => (
                                <span>
                                  {option.flag ? `${option.flag} ` : ''}
                                  {option.label}
                                </span>
                              )}
                              placeholder="Select country..."
                              width="100%"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="street"
                      control={addressForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="address2"
                      control={addressForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apartment / Suite (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="city"
                      control={addressForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="postcode"
                      control={addressForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postcode</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Continue
                    </Button>
                  </form>
                </Form>
              </FormProvider>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
          {/* Step 3: Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <FormProvider {...paymentForm}>
                <Form {...paymentForm}>
                  <form
                    onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      name="kind"
                      control={paymentForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sepa">Bank Account Europe (SEPA)</SelectItem>
                                <SelectItem value="swift">
                                  Bank Account International (SWIFT)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="currency"
                      control={paymentForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EUR">EUR €</SelectItem>
                                <SelectItem value="USD">USD $</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="name"
                      control={paymentForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="bank_name"
                      control={paymentForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="iban"
                      control={paymentForm.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IBAN</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Continue
                    </Button>
                  </form>
                </Form>
              </FormProvider>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="proceed">
          {/* Step 4: Proceed to Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Proceed to Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="font-semibold mb-2">Personal Info</div>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">
                  {JSON.stringify(formData.personal, null, 2)}
                </pre>
                <div className="font-semibold mb-2 mt-4">Address</div>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">
                  {JSON.stringify(formData.address, null, 2)}
                </pre>
                <div className="font-semibold mb-2 mt-4">Payment</div>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">
                  {JSON.stringify(formData.payment, null, 2)}
                </pre>
              </div>
              <Button className="w-full" onClick={handleProceed}>
                Proceed to Verification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
