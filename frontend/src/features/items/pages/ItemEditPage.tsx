import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { ItemForm } from '@/features/items/components/ItemForm';
import type { ItemFormValues } from '@/features/items/itemSchemas';
import { getItemForEditing } from '@/features/items/ownerItemLookup';
import { addImages, removeImage, updateItem } from '@/features/items/itemsService';
import type { OwnerItem } from '@/shared/api/types';
import { useApi } from '@/shared/lib/useApi';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { ErrorState, LoadingState } from '@/shared/ui/States';

interface EditPayload {
  item: OwnerItem;
  canManageImages: boolean;
}

const toFormValues = (item: OwnerItem): ItemFormValues => ({ title: item.title });

const buildPatch = (values: ItemFormValues) => ({ title: values.title });

const ItemEditPage = (): ReactNode => {
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

  if (user && item.owner.id !== user.id) {
    return <ErrorState message="You can only edit your own listings." />;
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
    await removeImage(itemId, publicId);
    reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent-700">Your listing</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Edit listing</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Update details or manage photos.{' '}
          <Link
            to={`/items/${item.id}`}
            className="font-medium text-accent-600 hover:text-accent-700"
          >
            View public page
          </Link>
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border border-line bg-surface p-5 sm:p-6">
        <ItemForm
          initialValues={toFormValues(item)}
          existingImages={canManageImages ? item.images : []}
          onRemoveImage={canManageImages ? handleRemoveImage : undefined}
          submitLabel={saving ? 'Saving…' : 'Save changes'}
          onSubmit={handleSubmit}
          footer={
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
          }
        />
      </div>

      <p className="text-xs text-ink-faint">
        Need to review claims?{' '}
        <Link
          to={`/items/${item.id}/claims`}
          className={buttonClasses('ghost', 'sm', 'h-auto px-1 py-0')}
        >
          Open the claims page
        </Link>
        .
      </p>
    </div>
  );
};

export default ItemEditPage;
