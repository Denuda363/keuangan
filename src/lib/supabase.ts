import { createClient } from '@supabase/supabase-js';

// Project info provided by user:
// Organization : Denuda
// Project name : keuangan
// Project ID : dlrlfvpmpobgeimmzdcw
// API URL : https://dlrlfvpmpobgeimmzdcw.supabase.co/rest/v1/
export const SUPABASE_URL = 'https://dlrlfvpmpobgeimmzdcw.supabase.co';
export const SUPABASE_PROJECT_ID = 'dlrlfvpmpobgeimmzdcw';
export const SUPABASE_PROJECT_NAME = 'keuangan';
export const SUPABASE_ORG = 'Denuda';

// Supabase client instance (or placeholder if anon key is not directly provided in client)
export const supabase = createClient(
  SUPABASE_URL,
  'public-anon-key'
);

export interface SupabaseStatus {
  connected: boolean;
  project: string;
  projectId: string;
  organization: string;
  database: string;
}

// Client API for seamless interaction with the Supabase backend
export const api = {
  async getStatus(): Promise<SupabaseStatus> {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      return {
        connected: data.connected ?? true,
        project: data.info?.project || SUPABASE_PROJECT_NAME,
        projectId: data.info?.projectId || SUPABASE_PROJECT_ID,
        organization: data.info?.organization || SUPABASE_ORG,
        database: data.database || 'Supabase (PostgreSQL)',
      };
    } catch {
      return {
        connected: false,
        project: SUPABASE_PROJECT_NAME,
        projectId: SUPABASE_PROJECT_ID,
        organization: SUPABASE_ORG,
        database: 'Supabase (PostgreSQL)',
      };
    }
  },

  async bootstrap() {
    const res = await fetch('/api/bootstrap');
    if (!res.ok) throw new Error('Gagal memuat data dari Supabase');
    return res.json();
  },

  async getTransactions() {
    const res = await fetch('/api/transactions');
    return res.json();
  },

  async createTransaction(tx: any) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    return res.json();
  },

  async updateTransaction(id: string, tx: any) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    return res.json();
  },

  async deleteTransaction(id: string) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getCategories() {
    const res = await fetch('/api/categories');
    return res.json();
  },

  async createCategory(cat: any) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    return res.json();
  },

  async updateCategory(id: string, cat: any) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    return res.json();
  },

  async deleteCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getAccounts() {
    const res = await fetch('/api/accounts');
    return res.json();
  },

  async getAdminPin() {
    const res = await fetch('/api/settings/pin');
    return res.json();
  },

  async setAdminPin(newPin: string) {
    const res = await fetch('/api/settings/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPin }),
    });
    return res.json();
  },

  async resetDatabase() {
    const res = await fetch('/api/reset', {
      method: 'POST',
    });
    return res.json();
  },

  async importData(data: any) {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
