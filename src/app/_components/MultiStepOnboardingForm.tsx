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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';
import { AsyncSelect } from '@/components/ui/async-select';
import { PhoneInput } from '@/components/ui/phone-input';

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
  // Convert birth_date to 'yyyy-MM-dd' string for storage
  const safeData = {
    ...data,
    personal: data.personal
      ? {
          ...data.personal,
          birth_date: data.personal.birth_date
            ? format(new Date(data.personal.birth_date), 'yyyy-MM-dd')
            : undefined,
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

// Update fetchCurrencies to use id for value/label
async function fetchCurrencies(lang: string) {
  const res = await fetch(`/api/abillio/currencies?is_payment_currency&lang=${lang}`);
  const data = await res.json();
  // Map API result to { value, label, symbol }
  return data.result.map((c: { id: string; symbol: string }) => ({
    value: c.id,
    label: c.id,
    symbol: c.symbol,
  }));
}

const filterCurrencies = (
  option: { value: string; label: string; symbol?: string },
  query: string,
) =>
  option.label.toLowerCase().includes(query.toLowerCase()) ||
  option.value.toLowerCase().includes(query.toLowerCase());

export default function MultiStepOnboardingForm({ language }: { language: string }) {
  const [activeStep, setActiveStep] = useState(0); // 0: personal, 1: address, 2: payment, 3: proceed
  const [stepStatus, setStepStatus] = useState<{ [key: string]: 'done' | 'pending' }>({
    personal: 'pending',
    address: 'pending',
    payment: 'pending',
    proceed: 'pending',
  });
  const [formData, setFormData] = useState<OnboardingFormData>({});
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

  // Step submit handlers
  function handlePersonalSubmit(values: PersonalFormData) {
    const newData = { ...formData, personal: values };
    setFormData(newData);
    saveToLocalStorage(newData);
    setStepStatus((prev) => ({ ...prev, personal: 'done' }));
    setActiveStep(1);
  }
  function handleAddressSubmit(values: AddressFormData) {
    const newData = { ...formData, address: values };
    setFormData(newData);
    saveToLocalStorage(newData);
    setStepStatus((prev) => ({ ...prev, address: 'done' }));
    setActiveStep(2);
  }
  function handlePaymentSubmit(values: PaymentFormData) {
    const newData = { ...formData, payment: values };
    setFormData(newData);
    saveToLocalStorage(newData);
    setStepStatus((prev) => ({ ...prev, payment: 'done' }));
    setActiveStep(3);
  }
  function handleProceed() {
    setStepStatus((prev) => ({ ...prev, proceed: 'done' }));
    alert('Proceeding to verification!');
  }

  // Helper for summary rendering
  function renderPersonalSummary() {
    const p = formData.personal;
    if (!p) return null;
    return (
      <>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
          <div>
            <div className="text-muted-foreground text-sm">First Name</div>
            <div className="font-semibold text-lg">
              {p.first_name || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Last Name</div>
            <div className="font-semibold text-lg">
              {p.last_name || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Date of birth</div>
            <div className="font-semibold text-lg">
              {p.birth_date ? (
                format(new Date(p.birth_date), 'yyyy-MM-dd')
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Tax Residency Country</div>
            <div className="font-semibold text-lg">
              {p.country || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-muted-foreground text-sm">
              National ID Number / Social Security Number
            </div>
            <div className="font-semibold text-lg">
              {p.personal_code || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-muted-foreground text-sm">TAX ID number</div>
            <div className="font-semibold text-lg">
              {p.tax_number || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            className="underline text-sm font-medium"
            onClick={() => setActiveStep(0)}
          >
            Edit
          </button>
        </div>
      </>
    );
  }
  function renderAddressSummary() {
    const a = formData.address;
    if (!a) return null;
    return (
      <>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
          <div>
            <div className="text-muted-foreground text-sm">Country</div>
            <div className="font-semibold text-lg">
              {a.country || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Street</div>
            <div className="font-semibold text-lg">
              {a.street || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">City</div>
            <div className="font-semibold text-lg">
              {a.city || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Postcode</div>
            <div className="font-semibold text-lg">
              {a.postcode || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-muted-foreground text-sm">Address 2</div>
            <div className="font-semibold text-lg">
              {a.address2 || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            className="underline text-sm font-medium"
            onClick={() => setActiveStep(1)}
          >
            Edit
          </button>
        </div>
      </>
    );
  }
  function renderPaymentSummary() {
    const p = formData.payment;
    if (!p) return null;
    return (
      <>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
          <div>
            <div className="text-muted-foreground text-sm">Kind</div>
            <div className="font-semibold text-lg">
              {p.kind || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Currency</div>
            <div className="font-semibold text-lg">
              {p.currency || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Name</div>
            <div className="font-semibold text-lg">
              {p.name || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Bank Name</div>
            <div className="font-semibold text-lg">
              {p.bank_name || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-muted-foreground text-sm">IBAN</div>
            <div className="font-semibold text-lg">
              {p.iban || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            className="underline text-sm font-medium"
            onClick={() => setActiveStep(2)}
          >
            Edit
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="w-full mt-8 space-y-6">
      {/* Step 1: Personal Info */}
      <Card className={activeStep === 0 ? '' : 'bg-muted/50'}>
        <div
          className={cn('flex items-top justify-between px-6', activeStep === 0 && 'pb-4 border-b')}
        >
          <div>
            <div className="text-muted-foreground">Step 1</div>
            <div className="font-bold">Personal Information</div>
          </div>
          {stepStatus.personal === 'done' && <CheckCircle className="text-green-500" />}
        </div>
        {activeStep === 0 ? (
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
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
                    name="country"
                    control={personalForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Residency Country</FormLabel>
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
                          <PhoneInput value={field.value} onChange={field.onChange} />
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
        ) : (
          <CardContent>{renderPersonalSummary()}</CardContent>
        )}
      </Card>

      {/* Step 2: Address */}
      <Card className={activeStep === 1 ? '' : 'bg-muted/50'}>
        <div
          className={cn('flex items-top justify-between px-6', activeStep === 1 && 'pb-4 border-b')}
        >
          <div>
            <div className="text-muted-foreground">Step 2</div>
            <div className="font-bold">Address</div>
          </div>
          {stepStatus.address === 'done' && <CheckCircle className="text-green-500" />}
        </div>
        {activeStep === 1 ? (
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
        ) : (
          stepStatus.personal === 'done' && <CardContent>{renderAddressSummary()}</CardContent>
        )}
      </Card>

      {/* Step 3: Payment */}
      <Card className={activeStep === 2 ? '' : 'bg-muted/50'}>
        <div
          className={cn('flex items-top justify-between px-6', activeStep === 2 && 'pb-4 border-b')}
        >
          <div>
            <div className="text-muted-foreground">Step 3</div>
            <div className="font-bold">Payment method</div>
          </div>
          {stepStatus.payment === 'done' && <CheckCircle className="text-green-500" />}
        </div>
        {activeStep === 2 ? (
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
                          <AsyncSelect
                            fetcher={() => fetchCurrencies(language)}
                            preload
                            filterFn={filterCurrencies}
                            label="Currency"
                            value={field.value}
                            onChange={field.onChange}
                            getOptionValue={(option: {
                              value: string;
                              label: string;
                              symbol?: string;
                            }) => option.value}
                            getDisplayValue={(option: {
                              value: string;
                              label: string;
                              symbol?: string;
                            }) => (
                              <span>
                                {option.symbol ? `${option.symbol} ` : ''}
                                {option.label}
                              </span>
                            )}
                            renderOption={(option: {
                              value: string;
                              label: string;
                              symbol?: string;
                            }) => (
                              <span>
                                {option.symbol ? `${option.symbol} ` : ''}
                                {option.label}
                              </span>
                            )}
                            placeholder="Select currency..."
                            width="100%"
                          />
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
        ) : (
          stepStatus.address === 'done' && <CardContent>{renderPaymentSummary()}</CardContent>
        )}
      </Card>

      {/* Step 4: Proceed */}
      <Card className={activeStep === 3 ? '' : 'bg-muted/50'}>
        <div
          className={cn('flex items-top justify-between px-6', activeStep === 3 && 'pb-4 border-b')}
        >
          <div>
            <div className="text-muted-foreground">Step 4</div>
            <div className="font-bold">Proceed to Verification</div>
          </div>
          {stepStatus.proceed === 'done' && <CheckCircle className="text-green-500" />}
        </div>
        {activeStep === 3 ? (
          <CardContent>
            <Button className="w-full" onClick={handleProceed}>
              Proceed to Verification
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
