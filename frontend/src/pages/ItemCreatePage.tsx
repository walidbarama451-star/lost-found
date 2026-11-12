import { useNavigate } from 'react-router-dom';
import ItemForm from '../components/ItemForm';
import type { ItemFormValues } from '../features/items/itemSchemas';
import { createItem } from '../features/items/itemsService';
import './ItemFormPages.css';

function buildFormData(values: ItemFormValues, files: File[]): FormData {
  const form = new FormData();
  form.append('title', values.title);
  for (const file of files) form.append('images', file);
  return form;
}

export { buildFormData };

export default function ItemCreatePage() {
  const navigate = useNavigate();

  const handleSubmit = async (values: ItemFormValues, files: File[]) => {
    const created = await createItem(buildFormData(values, files));
    navigate(`/items/${created.id}`, { replace: true });
  };

  return (
    <div className="item-form-page">
      <div className="page-header">
        <div>
          <h1>Post a found item</h1>
          <p className="muted">Add a clear photo and a short line about what you found.</p>
        </div>
      </div>

      <div className="card item-form-page__card">
        <ItemForm submitLabel="Publish listing" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
