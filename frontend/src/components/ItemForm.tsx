import { useState, type FormEvent, type ReactNode } from 'react';
import { resolveImageUrl } from '../lib/api';
import { categoryLabel } from '../lib/format';
import { toDisplayError, validateWith } from '../lib/validation';
import { CATEGORIES } from '../types';
import {
  emptyItemValues,
  itemSchema,
  type ItemFormValues,
} from '../features/items/itemSchemas';
import ImageUploader from './ImageUploader';
import './ItemForm.css';

export interface ExistingImage {
  url: string;
  publicId?: string;
}

interface ItemFormProps {
  initialValues?: ItemFormValues;
  /** Edit mode extras: images already stored on the listing. */
  existingImages?: ExistingImage[];
  onRemoveImage?: (publicId: string) => Promise<void>;
  submitLabel: string;
  onSubmit: (values: ItemFormValues, files: File[]) => Promise<void>;
  /** Extra controls rendered next to the submit button (e.g. Cancel). */
  footer?: ReactNode;
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Create/edit listing form. Field-level Zod errors mirror the backend rules;
 * API errors surface both a form message and per-field messages.
 */
export default function ItemForm({
  initialValues,
  existingImages,
  onRemoveImage,
  submitLabel,
  onSubmit,
  footer,
}: ItemFormProps) {
  const isEdit = Boolean(initialValues);
  const [values, setValues] = useState<ItemFormValues>(
    initialValues ?? { ...emptyItemValues, dateFound: todayIso() },
  );
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const set = (patch: Partial<ItemFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    // Clear the field's error as the user edits it.
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

    // Client pre-check: creating a listing needs at least one photo.
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
    <form className="item-form" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <p className="inline-alert inline-alert-error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="form-field">
        <label className="form-label" htmlFor="item-title">
          Title
        </label>
        <input
          id="item-title"
          className="form-control"
          type="text"
          value={values.title}
          onChange={(event) => set({ title: event.target.value })}
          aria-invalid={Boolean(errorFor('title'))}
          aria-describedby={errorFor('title') ? 'item-title-error' : undefined}
          maxLength={120}
          required
        />
        {errorFor('title') ? (
          <p className="form-error" id="item-title-error">
            {errorFor('title')}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="item-description">
          Description
        </label>
        <textarea
          id="item-description"
          className="form-control"
          value={values.description}
          onChange={(event) => set({ description: event.target.value })}
          aria-invalid={Boolean(errorFor('description'))}
          aria-describedby={errorFor('description') ? 'item-description-error' : undefined}
          placeholder="What did you find, distinguishing marks, contents…"
          required
        />
        {errorFor('description') ? (
          <p className="form-error" id="item-description-error">
            {errorFor('description')}
          </p>
        ) : null}
      </div>

      <div className="item-form__row">
        <div className="form-field">
          <label className="form-label" htmlFor="item-category">
            Category
          </label>
          <select
            id="item-category"
            className="form-control"
            value={values.category}
            onChange={(event) => set({ category: event.target.value })}
            aria-invalid={Boolean(errorFor('category'))}
            required
          >
            <option value="">Choose a category…</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
          {errorFor('category') ? <p className="form-error">{errorFor('category')}</p> : null}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="item-date">
            Date found
          </label>
          <input
            id="item-date"
            className="form-control"
            type="date"
            value={values.dateFound}
            max={todayIso()}
            onChange={(event) => set({ dateFound: event.target.value })}
            aria-invalid={Boolean(errorFor('dateFound'))}
            required
          />
          {errorFor('dateFound') ? <p className="form-error">{errorFor('dateFound')}</p> : null}
        </div>
      </div>

      {existingImages && existingImages.length > 0 ? (
        <div className="item-form__existing">
          <span className="form-label">Current photos</span>
          <ul className="item-form__existing-list">
            {existingImages.map((image) => {
              const canRemove = Boolean(onRemoveImage) && existingImages.length > 1 && image.publicId;
              return (
                <li key={image.publicId ?? image.url} className="item-form__existing-item">
                  <img src={resolveImageUrl(image.url) ?? ''} alt="Current listing photo" />
                  {canRemove && image.publicId ? (
                    <button
                      type="button"
                      className="item-form__existing-remove"
                      onClick={() => void handleRemoveImage(image.publicId as string)}
                      disabled={removing !== null}
                      aria-label="Remove this photo"
                    >
                      {removing === image.publicId ? '…' : '×'}
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

      <div className="item-form__footer">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {footer}
      </div>

      <p className="form-hint muted">
        {isEdit
          ? 'Changes are reviewed instantly and update the public listing.'
          : 'The listing appears in search once published.'}
      </p>
    </form>
  );
}
