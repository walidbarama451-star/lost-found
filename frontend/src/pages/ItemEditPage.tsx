import { Link, useNavigate, useParams } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import ItemForm from '../components/ItemForm';
import LoadingState from '../components/LoadingState';
import type { ItemFormValues } from '../features/items/itemSchemas';
import { getItemForEditing } from '../features/items/ownerItemLookup';
import {
  addImages,
  removeImage,
  updateItem,
} from '../features/items/itemsService';
import { useAuth } from '../features/auth/AuthContext';
import { useApi } from '../lib/useApi';
import type { OwnerItem } from '../types';
import { useState } from 'react';
import './ItemFormPages.css';

interface EditPayload {
  item: OwnerItem;
  canManageImages: boolean;
}

function toFormValues(item: OwnerItem): ItemFormValues {
  return {
    title: item.title,
    description: item.description,
    category: item.category,
    dateFound: item.dateFound.slice(0, 10),
  };
}

/** PATCH body: only fields the schema accepts; empty optionals omitted. */
function buildPatch(values: ItemFormValues) {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    dateFound: values.dateFound,
  };
}

export default function ItemEditPage() {
  const { itemId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useApi<EditPayload>(
    () => getItemForEditing(itemId),
    [itemId],
  );

  if (loading) return <LoadingState label="Loading listing…" />;
  if (error || !data) return <ErrorState message={error ?? 'Listing not found.'} onRetry={reload} />;

  const { item, canManageImages } = data;

  // Backend enforces ownership too — this is a UX shortcut only.
  if (user && item.owner.id !== user.id) {
    return (
      <ErrorState
        message="You can only edit your own listings."
        onRetry={undefined}
      />
    );
  }

  const handleSubmit = async (values: ItemFormValues, files: File[]) => {
    setSaving(true);
    try {
      await updateItem(itemId, buildPatch(values));
      if (files.length > 0) await addImages(itemId, files);
      navigate('/my-items', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async (publicId: string) => {
    // Errors are surfaced by ItemForm; success refreshes the owner payload.
    await removeImage(itemId, publicId);
    reload();
  };

  return (
    <div className="item-form-page">
      <div className="page-header">
        <div>
          <h1>Edit listing</h1>
          <p className="muted">
            Update details or manage photos.{' '}
            <Link to={`/items/${item.id}`}>View public page</Link>
          </p>
        </div>
      </div>

      <div className="card item-form-page__card">
        <ItemForm
          initialValues={toFormValues(item)}
          existingImages={canManageImages ? item.images : []}
          onRemoveImage={canManageImages ? handleRemoveImage : undefined}
          submitLabel={saving ? 'Saving…' : 'Save changes'}
          onSubmit={handleSubmit}
          footer={
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>
          }
        />
      </div>
    </div>
  );
}
