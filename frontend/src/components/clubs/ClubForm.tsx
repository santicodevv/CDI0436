'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { Club, Tutor } from '@/lib/types';
import { tutoresApi } from '@/lib/api/tutores';

interface ClubFormProps {
  club?: Club;
  onSubmit: (data: Partial<Club> & { tutor_id?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ClubForm({ club, onSubmit, onCancel }: ClubFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [loadingTutores, setLoadingTutores] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    codigo: '',
    capacidad_maxima: '',
    tutor_id: '',
  });

  useEffect(() => {
    loadTutores();
  }, []);

  useEffect(() => {
    if (club) {
      setFormData({
        nombre: club.nombre || '',
        descripcion: club.descripcion || '',
        codigo: club.codigo || '',
        capacidad_maxima: club.capacidad_maxima?.toString() || '',
        tutor_id: club.tutor?.id || '',
      });
    }
  }, [club]);

  const loadTutores = async () => {
    try {
      setLoadingTutores(true);
      const data = await tutoresApi.getAll({ activo: 'true' });
      setTutores(data.filter(t => t.tipo === 'club' || t.tipo === 'ambos'));
    } catch (err) {
      console.error('Error al cargar tutores:', err);
    } finally {
      setLoadingTutores(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data: Record<string, unknown> = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        codigo: formData.codigo,
        capacidad_maxima: formData.capacidad_maxima ? parseInt(formData.capacidad_maxima) : 0,
        tutor_id: formData.tutor_id || null,
      };

      for (const key of Object.keys(data)) {
        if (key !== 'tutor_id' && (data[key] === '' || data[key] === undefined)) {
          delete data[key];
        }
      }

      await onSubmit(data as Parameters<typeof onSubmit>[0]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar club');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre del Club *"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          placeholder="Club de Ciencias"
        />

        <Input
          label="Código"
          name="codigo"
          value={formData.codigo}
          onChange={handleChange}
          placeholder="CLB-101"
          disabled={!!club}
        />

        <Input
          label="Capacidad Máxima"
          name="capacidad_maxima"
          type="number"
          value={formData.capacidad_maxima}
          onChange={handleChange}
          placeholder="20"
          min="0"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tutor
          </label>
          <select
            name="tutor_id"
            value={formData.tutor_id}
            onChange={(e) => setFormData(prev => ({ ...prev, tutor_id: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loadingTutores}
          >
            <option value="">Sin tutor asignado</option>
            {tutores.map((tutor) => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.nombre} {tutor.apellido || ''} {tutor.especialidad ? `- ${tutor.especialidad}` : ''}
              </option>
            ))}
          </select>
          {loadingTutores && (
            <p className="text-xs text-gray-500 mt-1">Cargando tutores...</p>
          )}
          {!loadingTutores && tutores.length === 0 && (
            <p className="text-xs text-amber-700 mt-1">
              No hay tutores de tipo Club o Ambos. Cámbialo en{' '}
              <Link href="/dashboard/tutores" target="_blank" className="font-semibold underline">
                Tutores
              </Link>
              .
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descripción del club..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
        >
          {club ? 'Actualizar' : 'Crear'} Club
        </Button>
      </div>
    </form>
  );
}
