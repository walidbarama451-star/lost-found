import { useState, type FormEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { resolveImageUrl } from '@/shared/api/client';
import { toDisplayError, validateWith } from '@/shared/lib/validation';
import {
  emptyItemValues,
  itemSchema,
  type ItemFormValues,
} from '@/features/items/itemSchemas';
import { Button } from '@/shared/ui/Button';
import { errorClass, fieldClass, hintClass, inputClass, labelClass } from '@/shared/ui/formStyles';
import { ImageUploader } from './ImageUploader';

export interface ExistingImage {
  url: string;
  publicId?: string;
}

interface ItemFormProps {
  initialValues?: ItemFormValues;
  existingImages?: ExistingImage[];
  onRemoveImage?: (publicId: string) => Promise<void>;
  submitLabel: string;
  onSubmit: (values: ItemFormValues, files: File[]) => Promise<void>;
  footer?: ReactNode;
}

export const ItemForm = ({
  initialValues,
  existingImages,
  onRemoveImage,
  submitLabel,
  onSubmit,
  footer,
}: ItemFormProps): ReactNode => {
  const isEdit = Boolean(initialValues);
  const [values, setValues] = useState<ItemFormValues>(initialValues ?? { ...emptyItemValues });
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const set = (patch: Partial<ItemFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    const touched = Object.keys(patch)[0];
    if (touched && fieldErrors[touched]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[touched];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const check = validateWith<ItemFormValues>(itemSchema, values);
    if (!check.ok) {
      setFieldErrors(check.fieldErrors);
      setFormError(check.message);
      return;
    }

    if (!isEdit && files.length === 0) {
      setFormError('Select at least one photo.');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit(check.data, files);
      setFiles([]);
    } catch (error) {
      const display = toDisplayError(error);
      setFormError(display.message);
      setFieldErrors((prev) => ({ ...prev, ...display.fieldErrors }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveImage = async (publicId: string) => {
    if (!onRemoveImage) return;
    setFormError(null);
    setRemoving(publicId);
    try {
      await onRemoveImage(publicId);
    } catch (error) {
      setFormError(toDisplayError(error).message);
    } finally {
      setRemoving(null);
    }
  };

  const errorFor = (field: string) => fieldErrors[field];

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <p
          className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div className={fieldClass}>
        <label className={labelClass} htmlFor="item-title">
          What did you find?
        </label>
        <input
          id="item-title"
          className={inputClass}
          type="text"
          value={values.title}
          onChange={(event) => set({ title: event.target.value })}
          aria-invalid={Boolean(errorFor('title'))}
          aria-describedby={errorFor('title') ? 'item-title-error' : undefined}
          placeholder="e.g. black wallet"
          maxLength={120}
          required
        />
        {errorFor('title') ? (
          <p className={errorClass} id="item-title-error">
            {errorFor('title')}
          </p>
        ) : null}
      </div>

      {existingImages && existingImages.length > 0 ? (
        <div className="space-y-2">
          <span className={labelClass}>Current photos</span>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingImages.map((image) => {
              const canRemove =
                Boolean(onRemoveImage) && existingImages.length > 1 && image.publicId;
              return (
                <li
                  key={image.publicId ?? image.url}
                  className="relative aspect-square overflow-hidden rounded-lg border border-line bg-overlay"
                >
                  <img
                    className="size-full object-cover"
                    src={resolveImageUrl(image.url) ?? ''}
                    alt="Current listing photo"
                  />
                  {canRemove && image.publicId ? (
                    <button
                      type="button"
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-canvas/85 text-ink transition-colors hover:bg-danger hover:text-white disabled:opacity-60"
                      onClick={() => void handleRemoveImage(image.publicId as string)}
                      disabled={removing !== null}
                      aria-label="Remove this photo"
                    >
                      <X size={13} aria-hidden />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <ImageUploader
        files={files}
        onFilesChange={setFiles}
        existingCount={existingImages?.length ?? 0}
        disabled={submitting}
        error={null}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
        {footer}
      </div>

      <p className={hintClass}>
        {isEdit
          ? 'Changes are reviewed instantly and update the public listing.'
          : 'The listing appears in search once published.'}
      </p>
    </form>
  );
};
