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

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info } from 'lucide-react';
import { JsonViewer } from '@/components/ui/json-tree-viewer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ClientCodeBlock } from '@/components/ui/ClientCodeBlock';
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

const paymentSchema = z
  .object({
    kind: z.enum(['sepa', 'swift', 'card', 'paypal']),
    currency: z.string().min(1),
    name: z.string().optional(),
    iban: z.string().optional(),
    bank_name: z.string().optional(),
    bic_swift: z.string().optional(),
    account_number: z.string().optional(),
    ach: z.string().optional(),
    wire_routing_number: z.string().optional(),
    branch_name: z.string().optional(),
    bank_address: z.string().optional(),
    card_number: z.string().optional(),
    name_on_card: z.string().optional(),
    paypal_email: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'sepa' && !data.iban) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'IBAN is required for SEPA accounts',
        path: ['iban'],
      });
    }
    if (data.kind === 'swift') {
      if (!data.bank_name)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bank name is required for SWIFT accounts',
          path: ['bank_name'],
        });
      if (!data.bic_swift)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'BIC/SWIFT is required for SWIFT accounts',
          path: ['bic_swift'],
        });
      if (!data.account_number)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account number is required for SWIFT accounts',
          path: ['account_number'],
        });
    }
    if (data.kind === 'card') {
      if (!data.card_number)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Card number is required for card accounts',
          path: ['card_number'],
        });
      if (!data.name_on_card)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Name on card is required for card accounts',
          path: ['name_on_card'],
        });
    }
    if (data.kind === 'paypal' && !data.paypal_email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PayPal email is required for PayPal accounts',
        path: ['paypal_email'],
      });
    }
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
  kind: 'sepa' | 'swift' | 'card' | 'paypal';
  currency: string;
  name?: string;
  iban?: string;
  bank_name?: string;
  bic_swift?: string;
  account_number?: string;
  ach?: string;
  wire_routing_number?: string;
  branch_name?: string;
  bank_address?: string;
  card_number?: string;
  name_on_card?: string;
  paypal_email?: string;
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
  if (!data.result || !Array.isArray(data.result)) {
    console.error('fetchAndCacheCountries: API atbilde nesatur result masīvu', data);
    return [];
  }
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

// Helper funkcija, kas atgriež tikai atbilstošos bank_account laukus pēc kind
function filterBankAccountByKind(payment: PaymentFormData): Record<string, unknown> {
  const { kind, currency } = payment;
  if (kind === 'sepa') {
    return {
      kind,
      currency,
      name: payment.name,
      bank_name: payment.bank_name,
      iban: payment.iban,
    };
  }
  if (kind === 'swift') {
    return {
      kind,
      currency,
      name: payment.name,
      bank_name: payment.bank_name,
      bic_swift: payment.bic_swift,
      account_number: payment.account_number,
      ach: payment.ach,
      wire_routing_number: payment.wire_routing_number,
      branch_name: payment.branch_name,
      bank_address: payment.bank_address,
    };
  }
  if (kind === 'card') {
    return {
      kind,
      currency,
      card_number: payment.card_number,
      name_on_card: payment.name_on_card,
    };
  }
  if (kind === 'paypal') {
    return {
      kind,
      currency,
      paypal_email: payment.paypal_email,
    };
  }
  return { kind, currency };
}

function generatePayload(formData: OnboardingFormData) {
  if (!formData.personal || !formData.address || !formData.payment) return null;
  const p = formData.personal;
  const a = formData.address;
  const pay = formData.payment;
  // Apvieno adresi vienā stringā
  const address = [a.street, a.address2, a.city, a.postcode, a.country].filter(Boolean).join(', ');
  // birth_date uz yyyy-MM-dd
  const birth_date = p.birth_date ? format(new Date(p.birth_date), 'yyyy-MM-dd') : undefined;
  // Bank account tikai ar atbilstošiem laukiem
  const bank_account = filterBankAccountByKind(pay);
  Object.keys(bank_account).forEach((k) => {
    if (bank_account[k] === undefined || bank_account[k] === '') delete bank_account[k];
  });
  // Galvenais payload
  const payload: Record<string, unknown> = {
    email: p.email,
    first_name: p.first_name,
    last_name: p.last_name,
    language: p.language,
    gender: p.gender,
    country: p.country,
    birth_date,
    personal_code: p.personal_code,
    tax_number: p.tax_number,
    phone: p.phone,
    address,
    bank_account,
  };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined || payload[k] === '') delete payload[k];
  });
  return payload;
}

// Helper to get/set abillioFreelancers map in localStorage
function getFreelancerIdMap(): Record<string, FreelancerResult> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('abillioFreelancers') || '{}');
  } catch {
    return {};
  }
}
function setFreelancerIdForEmail(email: string, data: FreelancerResult) {
  const map = getFreelancerIdMap();
  map[email] = data;
  localStorage.setItem('abillioFreelancers', JSON.stringify(map));
}

// --- API Response Types ---
export interface InviteResult {
  is_sent: boolean;
  is_signed_up: boolean;
  email: string;
  lang: string;
  message: string | null;
  client: string;
  sent_by: string;
  account: string;
  url: string;
}

export interface BankAccount {
  id: string;
  kind: string;
  name?: string | null;
  is_verified?: boolean;
  currency?: string;
  bank_name?: string | null;
  iban?: string;
  bic_swift?: string;
  account_number?: string;
  ach?: string;
  wire_routing_number?: string;
  branch_name?: string;
  bank_address?: string;
  name_on_card?: string;
  card_number?: string;
  paypal_email?: string;
}

export interface FreelancerResult {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  gender?: string | null;
  member_data_is_provided?: boolean;
  bank_account_is_provided?: boolean;
  bank_account_is_verified?: boolean;
  bank_accounts?: BankAccount[];
  can_send_invoice?: boolean;
  country?: string;
  language?: string;
  birth_date?: string;
  personal_code?: string;
  tax_number?: string;
  phone?: string;
  address?: string;
  kyc_is_provided?: boolean;
  kyc_is_pending?: boolean;
  kyc_is_verified?: boolean;
  kyc_is_failed?: boolean;
  kyc?: unknown[];
  kyc_setup_script?: string;
  error?: string;
  invite?: InviteResult;
  [key: string]: unknown;
}

// Helper to fetch freelancer by ID
async function getFreelancer(id: string, lang: string): Promise<{ result: FreelancerResult }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/abillio/freelancers/${id}?lang=${lang}`,
    { method: 'GET' },
  );
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Helper to create freelancer
async function createFreelancer(
  payload: object,
  lang: string,
): Promise<{ result: FreelancerResult }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/abillio/freelancers?lang=${lang}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export default function MultiStepOnboardingForm({ language }: { language: string }) {
  const [activeStep, setActiveStep] = useState(0); // 0: personal, 1: address, 2: payment, 3: proceed, 4: result
  const [stepStatus, setStepStatus] = useState<{ [key: string]: 'done' | 'pending' }>({
    personal: 'pending',
    address: 'pending',
    payment: 'pending',
    proceed: 'pending',
    result: 'pending',
  });
  const [formData, setFormData] = useState<OnboardingFormData>({});
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [freelancer, setFreelancer] = useState<FreelancerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteFreelancer, setInviteFreelancer] = useState<FreelancerResult | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Step 1: Personal Info
  const personalForm = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      language: formData.personal?.language || language,
      email: formData.personal?.email || '',
      first_name: formData.personal?.first_name || '',
      last_name: formData.personal?.last_name || '',
      gender: formData.personal?.gender || 'male',
      birth_date: formData.personal?.birth_date ? new Date(formData.personal?.birth_date) : null,
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

  // Sync form values with formData (localStorage) for all forms
  useEffect(() => {
    if (formData.personal && formData.personal.language) {
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
  }, [formData, personalForm, addressForm, paymentForm]);

  // Load from localStorage on mount
  useEffect(() => {
    const data = loadFromLocalStorage();
    if (data) setFormData(data);
  }, []);

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
  async function handleProceed() {
    setLoading(true);
    setError(null);
    setInviteFreelancer(null);
    setInviteError(null);
    try {
      const payload = generatePayload(formData);
      if (!payload) throw new Error('Missing form data');
      // Use createFreelancer helper
      const data = await createFreelancer(payload, language);
      setFreelancer(data.result);
      // Always save freelancer data for email if present, even if error exists
      if (data?.result?.id && formData.personal?.email) {
        setFreelancerIdForEmail(formData.personal.email, data.result);
      }
      setStepStatus((prev) => ({ ...prev, proceed: 'done', result: 'done' }));
      setActiveStep(4);
      // If invite object present, fetch freelancer details
      if (data?.result?.invite && data?.result?.id) {
        setInviteLoading(true);
        try {
          const inviteData = await getFreelancer(data.result.id, language);
          setInviteFreelancer(inviteData.result);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setInviteError(err.message || 'Failed to fetch invited freelancer');
          } else {
            setInviteError('Failed to fetch invited freelancer');
          }
        } finally {
          setInviteLoading(false);
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || 'API error');
      } else {
        setError('API error');
      }
    } finally {
      setLoading(false);
    }
  }

  // Helper for summary rendering
  function renderPersonalSummary() {
    const p = formData.personal;
    if (!p) return null;

    // Valodu nosaukumi
    const languageLabels: Record<string, string> = {
      lv: 'Latviešu',
      en: 'English',
      de: 'Deutsch',
      ru: 'Русский',
      pl: 'Polski',
      ro: 'Română',
      bg: 'Български',
      sr: 'Srpski',
      et: 'Eesti',
    };

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
          <div>
            <div className="text-muted-foreground text-sm">Language</div>
            <div className="font-semibold text-lg">
              {languageLabels[p.language] || p.language || (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Email</div>
            <div className="font-semibold text-lg">
              {p.email || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
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
            <div className="text-muted-foreground text-sm">Gender</div>
            <div className="font-semibold text-lg">
              {p.gender || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Date of birth</div>
            <div className="font-semibold text-lg">
              {p.birth_date ? (
                typeof p.birth_date === 'string' ? (
                  p.birth_date
                ) : (
                  format(new Date(p.birth_date), 'yyyy-MM-dd')
                )
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
          <div>
            <div className="text-muted-foreground text-sm">
              National ID Number / Social Security Number
            </div>
            <div className="font-semibold text-lg">
              {p.personal_code || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">TAX ID number</div>
            <div className="font-semibold text-lg">
              {p.tax_number || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Phone</div>
            <div className="font-semibold text-lg">
              {p.phone || <span className="text-muted-foreground">—</span>}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
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
    if (p.kind === 'sepa') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
            <div>
              <div className="text-muted-foreground text-sm">Kind</div>
              <div className="font-semibold text-lg">{p.kind}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Currency</div>
              <div className="font-semibold text-lg">{p.currency}</div>
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
    if (p.kind === 'swift') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
            <div>
              <div className="text-muted-foreground text-sm">Kind</div>
              <div className="font-semibold text-lg">{p.kind}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Currency</div>
              <div className="font-semibold text-lg">{p.currency}</div>
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
            <div>
              <div className="text-muted-foreground text-sm">BIC/SWIFT</div>
              <div className="font-semibold text-lg">
                {p.bic_swift || <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Account Number</div>
              <div className="font-semibold text-lg">
                {p.account_number || <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">ACH</div>
              <div className="font-semibold text-lg">
                {p.ach || <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Wire Routing Number</div>
              <div className="font-semibold text-lg">
                {p.wire_routing_number || <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Branch Name</div>
              <div className="font-semibold text-lg">
                {p.branch_name || <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Bank Address</div>
              <div className="font-semibold text-lg">
                {p.bank_address || <span className="text-muted-foreground">—</span>}
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
    if (p.kind === 'card') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
            <div>
              <div className="text-muted-foreground text-sm">Kind</div>
              <div className="font-semibold text-lg">{p.kind}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Currency</div>
              <div className="font-semibold text-lg">{p.currency}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Card Number</div>
              <div className="font-semibold text-lg">
                {p.card_number || <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Name on Card</div>
              <div className="font-semibold text-lg">
                {p.name_on_card || <span className="text-muted-foreground">—</span>}
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
    if (p.kind === 'paypal') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
            <div>
              <div className="text-muted-foreground text-sm">Kind</div>
              <div className="font-semibold text-lg">{p.kind}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Currency</div>
              <div className="font-semibold text-lg">{p.currency}</div>
            </div>
            <div className="col-span-2">
              <div className="text-muted-foreground text-sm">PayPal Email</div>
              <div className="font-semibold text-lg">
                {p.paypal_email || <span className="text-muted-foreground">—</span>}
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
    return null;
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
            {activeStep === 0 ? (
              <div className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
                For the onboarding process, we need to get the user&apos;s required data.
              </div>
            ) : null}
          </div>
          {stepStatus.personal === 'done' && <CheckCircle className="text-green-500" />}
        </div>
        {activeStep === 0 ? (
          <CardContent>
            <FormProvider {...personalForm}>
              <Form {...personalForm}>
                <form
                  onSubmit={personalForm.handleSubmit(handlePersonalSubmit)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
                >
                  <FormField
                    name="language"
                    control={personalForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel>Language</FormLabel>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                tabIndex={0}
                                className="p-0 m-0 bg-transparent border-0 cursor-pointer"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" aria-label="Info" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm" align="start" side="top">
                              This is the language that will be used in communication with user in
                              emails.
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            key={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lv">Latviešu</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="de">Deutsch</SelectItem>
                              <SelectItem value="ru">Русский</SelectItem>
                              <SelectItem value="pl">Polski</SelectItem>
                              <SelectItem value="ro">Română</SelectItem>
                              <SelectItem value="bg">Български</SelectItem>
                              <SelectItem value="sr">Srpski</SelectItem>
                              <SelectItem value="et">Eesti</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="email"
                    control={personalForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel>Email</FormLabel>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                tabIndex={0}
                                className="p-0 m-0 bg-transparent border-0 cursor-pointer"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" aria-label="Info" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm" align="start" side="top">
                              With this email user will be onboarded to Abillio and can login to
                              Abillio using this email.
                            </HoverCardContent>
                          </HoverCard>
                        </div>
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
                        <div className="flex items-center gap-1">
                          <FormLabel>First Name</FormLabel>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                tabIndex={0}
                                className="p-0 m-0 bg-transparent border-0 cursor-pointer"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" aria-label="Info" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm" align="start" side="top">
                              This is required for legal purposes.
                              <br />
                              <span className="text-destructive">
                                After your profile is verified (KYC), this field can no longer be
                                changed.
                              </span>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
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
                            <SelectTrigger className="w-full">
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
                        <div className="flex items-center gap-1">
                          <FormLabel>Date of Birth</FormLabel>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                tabIndex={0}
                                className="p-0 m-0 bg-transparent border-0 cursor-pointer"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" aria-label="Info" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm" align="start" side="top">
                              This is required for legal purposes.
                              <br />
                              <span className="text-destructive">
                                After your profile is verified (KYC), this field can no longer be
                                changed.
                              </span>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
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
                        <div className="flex items-center gap-1">
                          <FormLabel>Personal Code</FormLabel>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                tabIndex={0}
                                className="p-0 m-0 bg-transparent border-0 cursor-pointer"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" aria-label="Info" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm" align="start" side="top">
                              This is required for legal purposes.
                              <br />
                              <span className="text-destructive">
                                After your profile is verified (KYC), this field can no longer be
                                changed.
                              </span>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
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
                        <div className="flex items-center gap-1">
                          <FormLabel>Tax Residency Country</FormLabel>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                tabIndex={0}
                                className="p-0 m-0 bg-transparent border-0 cursor-pointer"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" aria-label="Info" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm" align="start" side="top">
                              Mandatory for correct tax calculation for invoices.
                              <br />
                              <span className="text-destructive">
                                After your profile is verified (KYC), this field can no longer be
                                changed.
                              </span>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
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
                            }) => <span>{option.label}</span>}
                            renderOption={(option: {
                              value: string;
                              label: string;
                              flag?: string;
                            }) => (
                              <span>
                                {/* {option.flag ? `${option.flag} ` : ''} */}
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
                        <div className="flex items-center gap-1">
                          <FormLabel>Tax Number (optional)</FormLabel>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                tabIndex={0}
                                className="p-0 m-0 bg-transparent border-0 cursor-pointer"
                              >
                                <Info className="w-4 h-4 text-muted-foreground" aria-label="Info" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm" align="start" side="top">
                              This is required for legal purposes.
                              <br />
                              <span className="text-destructive">
                                After your profile is verified (KYC), this field can no longer be
                                changed.
                              </span>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
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
                  <Button type="submit" className="col-span-full w-full">
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
            {activeStep === 1 ? (
              <div className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
                Address is required for some payment methods for example SWIFT.
              </div>
            ) : null}
          </div>
          {stepStatus.address === 'done' && <CheckCircle className="text-green-500" />}
        </div>
        {activeStep === 1 ? (
          <CardContent>
            <FormProvider {...addressForm}>
              <Form {...addressForm}>
                <form
                  onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
                >
                  <FormField
                    name="country"
                    control={addressForm.control}
                    render={({ field }) => (
                      <FormItem className="col-span-1 ">
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
                      <FormItem className="col-span-1 ">
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
                      <FormItem className="col-span-1 ">
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
                      <FormItem className="col-span-1 ">
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
                      <FormItem className="col-span-1 ">
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="col-span-full w-full">
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
            {activeStep === 2 ? (
              <div className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
                Provide the payment method you want to use. You can add more payment methods later.
              </div>
            ) : null}
          </div>
          {stepStatus.payment === 'done' && <CheckCircle className="text-green-500" />}
        </div>
        {activeStep === 2 ? (
          <CardContent>
            <FormProvider {...paymentForm}>
              <Form {...paymentForm}>
                <form
                  onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
                >
                  <FormField
                    name="kind"
                    control={paymentForm.control}
                    render={({ field }) => (
                      <FormItem className="col-span-1 ">
                        <FormLabel>Account Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sepa">SEPA</SelectItem>
                              <SelectItem value="swift">SWIFT</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
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
                      <FormItem className="col-span-1 ">
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
                  {paymentForm.watch('kind') === 'sepa' && (
                    <>
                      <FormField
                        name="iban"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>IBAN</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {paymentForm.watch('kind') === 'swift' && (
                    <>
                      <FormField
                        name="bank_name"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="bic_swift"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>BIC/SWIFT</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="account_number"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="ach"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>ACH</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="wire_routing_number"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>Wire Routing Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="branch_name"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>Branch Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="bank_address"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>Bank Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {paymentForm.watch('kind') === 'card' && (
                    <>
                      <FormField
                        name="card_number"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="name_on_card"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>Name on Card</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {paymentForm.watch('kind') === 'paypal' && (
                    <>
                      <FormField
                        name="paypal_email"
                        control={paymentForm.control}
                        render={({ field }) => (
                          <FormItem className="col-span-1 ">
                            <FormLabel>PayPal Email</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  <Button type="submit" className="col-span-full w-full">
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
            {activeStep === 3 ? (
              <div className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
                In this step we will post the data to the API and freelancer will be registered. In
                the response you will receive a freelancer ID that you must store in your database
                for your user and a verification script that creates Button.
              </div>
            ) : null}
          </div>
          {stepStatus.proceed === 'done' && <CheckCircle className="text-green-500" />}
        </div>
        {activeStep === 3 ? (
          <CardContent>
            <p>Payload preview</p>
            <pre className="mt-4 bg-muted rounded p-4 text-xs overflow-x-auto">
              {JSON.stringify(generatePayload(formData), null, 2)}
            </pre>
            {error && <div className="text-destructive my-2">{error}</div>}
            <div className="flex flex-col md:flex-row gap-2 mt-2">
              <Button className="w-full md:w-auto" onClick={handleProceed} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit data'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full md:w-auto"
                onClick={() => setActiveStep(2)}
              >
                Edit previous steps
              </Button>
            </div>
          </CardContent>
        ) : null}
      </Card>

      {/* Step 5: Result */}
      {activeStep === 4 && (
        <Card>
          <div className="flex items-top justify-between px-6 pb-4 border-b">
            <div>
              <div className="text-muted-foreground">Step 5</div>
              <div className="font-bold">KYC Verification</div>
            </div>
            {stepStatus.result === 'done' && <CheckCircle className="text-green-500" />}
          </div>
          <CardContent>
            {freelancer ? (
              <>
                {freelancer.error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{freelancer.error}</AlertDescription>
                  </Alert>
                )}
                {!freelancer.error ? (
                  <>
                    <div className="font-bold mb-2">Freelancer data</div>
                    <div className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
                      We have created a freelancer in abillio. The next step is to verify the
                      freelancer. Check the KYC status and if it is not verified, inject the KYC
                      script form the field `kyc_setup_script` to the page. that will create a
                      button within the div with id=&apos;abillio-kyc&apos;.
                    </div>
                    <div className="mt-2 text-sm/6 font-[family-name:var(--font-geist-mono)] text-destructive">
                      Dont show the KYC button if the KYC is already verified.
                    </div>
                    <p className="mt-2">
                      KYC is provided{' '}
                      <Badge variant={freelancer.kyc_is_provided ? 'default' : 'destructive'}>
                        {freelancer.kyc_is_provided ? 'Yes' : 'No'}
                      </Badge>
                    </p>
                    <p className="mt-2">
                      KYC is verified{' '}
                      <Badge variant={freelancer.kyc_is_verified ? 'default' : 'destructive'}>
                        {freelancer.kyc_is_verified ? 'Yes' : 'No'}
                      </Badge>
                    </p>

                    <p className="mt-2">
                      KYC is pending{' '}
                      <Badge variant={freelancer.kyc_is_pending ? 'destructive' : 'outline'}>
                        {freelancer.kyc_is_pending ? 'Yes' : 'No'}
                      </Badge>
                    </p>

                    <p className="mt-2">
                      KYC failed{' '}
                      <Badge variant={freelancer.kyc_is_failed ? 'destructive' : 'outline'}>
                        {freelancer.kyc_is_failed ? 'Yes' : 'No'}
                      </Badge>
                    </p>
                    {((freelancer.kyc_is_provided === false &&
                      freelancer.kyc_is_pending === false &&
                      freelancer.kyc_is_verified === false) ||
                      freelancer.kyc_is_failed === true) &&
                    freelancer.kyc_setup_script ? (
                      <>
                        <pre className="mt-4 bg-muted rounded p-4 text-xs overflow-x-auto">
                          {freelancer.kyc_setup_script}
                        </pre>

                        <div id="abillio-kyc" />

                        <div className="mb-2 mt-4 text-sm/6 font-[family-name:var(--font-geist-mono)]">
                          You can override the button component styles
                        </div>
                        <ClientCodeBlock
                          code={`#abillio-kyc {
  #veriff-root {
    max-width: initial;
    min-width: initial;
    font-family: inherit !important;
    .veriff-container {
      .veriff-submit {
        @apply bg-primary text-primary-foreground;
      }
      .veriff-description {
        @apply hidden;
      }
    }
  }
}`}
                          language="css"
                        />
                      </>
                    ) : (
                      <>
                        <pre className="mt-4 bg-muted rounded p-4 text-xs overflow-x-auto">
                          {JSON.stringify(freelancer.kyc, null, 2)}
                        </pre>
                      </>
                    )}
                  </>
                ) : null}

                <div className="mb-2 mt-4 text-sm/6 font-[family-name:var(--font-geist-mono)]">
                  Response from the API
                </div>
                <JsonViewer
                  data={freelancer}
                  className="rounded-md p-4 my-4 border max-h-[300px] overflow-y-auto"
                />
                {/* KYC Button Mounting */}
                {((freelancer.kyc_is_provided === false &&
                  freelancer.kyc_is_pending === false &&
                  freelancer.kyc_is_verified === false) ||
                  freelancer.kyc_is_failed === true) &&
                freelancer.kyc_setup_script ? (
                  <KycScriptInjector script={freelancer.kyc_setup_script} />
                ) : null}
                {/* Show invite freelancer details if present */}
                {freelancer.invite && (
                  <div className="mt-6">
                    <div className="font-bold mb-2">Invited Freelancer Details</div>
                    {inviteLoading ? (
                      <div className="text-muted-foreground">Loading...</div>
                    ) : inviteError ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{inviteError}</AlertDescription>
                      </Alert>
                    ) : inviteFreelancer ? (
                      <JsonViewer data={inviteFreelancer} className="rounded-md p-4 my-4 border" />
                    ) : null}
                  </div>
                )}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => setActiveStep(3)}
                  >
                    Edit & Retry
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No result</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KycScriptInjector({ script }: { script: string }) {
  useEffect(() => {
    console.log('[KYC] KycScriptInjector mounted');
    // Remove previous script
    const prev = document.getElementById('abillio-kyc-script');
    if (prev) {
      console.log('[KYC] Removing previous script');
      prev.remove();
    }
    // Clean abillio-kyc div
    const div = document.getElementById('abillio-kyc');
    if (div) {
      console.log('[KYC] Found abillio-kyc div, clearing innerHTML');
      div.innerHTML = '';
    } else {
      console.warn('[KYC] abillio-kyc div not found!');
    }
    // Parse src and onload from script string
    let src = '';
    let onload = '';
    if (script.includes("src='")) {
      const start = script.indexOf("src='") + 5;
      const end = script.indexOf("'", start);
      src = script.substring(start, end);
    } else if (script.includes('src="')) {
      const start = script.indexOf('src="') + 5;
      const end = script.indexOf('"', start);
      src = script.substring(start, end);
    }
    if (script.includes("onload='")) {
      const start = script.indexOf("onload='") + 8;
      const end = script.indexOf("'", start);
      onload = script.substring(start, end);
    } else if (script.includes('onload="')) {
      const start = script.indexOf('onload="') + 8;
      const end = script.indexOf('"', start);
      onload = script.substring(start, end);
    }
    console.log('[KYC] Parsed src:', src);
    console.log('[KYC] Parsed onload:', onload);
    const scriptEl = document.createElement('script');
    scriptEl.id = 'abillio-kyc-script';
    scriptEl.src = src;
    scriptEl.async = true;
    scriptEl.onload = () => {
      console.log('[KYC] Script loaded, executing onload code:', onload);
      try {
        eval(onload);
        console.log('[KYC] onload code executed');
        // Kad abillio_kyc ir pieejams, piesaisti event listener
        if (window.abillio_kyc && typeof window.abillio_kyc.setOnEvent === 'function') {
          console.log('KYC widgets ir pieejams (onload)');
          window.abillio_kyc.setOnEvent(function (event: string, response: unknown) {
            console.log('KYC event:', event);
            console.log('KYC response:', response);
          });
        } else {
          console.warn('KYC widgets nav pieejams (onload)');
        }
      } catch (e) {
        console.error('[KYC] Error executing onload code:', e);
      }
    };
    document.body.appendChild(scriptEl);
    console.log('[KYC] Script element appended to body');
    return () => {
      const prev = document.getElementById('abillio-kyc-script');
      if (prev) {
        console.log('[KYC] Cleaning up script on unmount');
        prev.remove();
      }
    };
  }, [script]);
  return null;
}
