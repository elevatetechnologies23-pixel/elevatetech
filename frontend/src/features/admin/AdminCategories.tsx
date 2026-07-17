import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState([
    { name: 'Laptop', slug: 'laptop', description: 'Computers & Laptops sales' },
    { name: 'CCTV Camera', slug: 'cctv-camera', description: 'CCTV Dome/Bullet installations' },
    { name: 'Billing Software', slug: 'billing-software', description: 'POS Software licenses' },
    { name: 'Networking', slug: 'networking', description: 'Switches, routers & cables' }
  ]);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const newCat = {
      name: newCatName,
      slug: newCatName.toLowerCase().replace(/\s+/g, '-'),
      description: newCatDesc
    };

    setCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatDesc('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-100 dark:border-primary-500 pb-4">
        <h2 className="text-xl font-bold">Categories & Brands Management</h2>
        <p className="text-xs text-slate-400 mt-1">Organize category trees, tag brands, and configure filter specifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-xs">
        
        {/* Create form */}
        <div className="glass-card p-6 h-fit space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-primary-500">
            <Plus size={16} className="text-accent-blue" /> Add New Category
          </h3>
          
          {isSuccess && (
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl text-center font-semibold">
              Category created successfully!
            </div>
          )}

          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-1">
              <span>Category Name</span>
              <input 
                type="text" required placeholder="e.g. Memory Modules"
                value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                className="input-field py-2"
              />
            </div>
            <div className="space-y-1">
              <span>Description</span>
              <textarea 
                placeholder="Marketing category details..."
                value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)}
                className="input-field py-2 resize-none" rows={3}
              />
            </div>
            <button type="submit" className="w-full btn-primary py-2.5 rounded-xl font-bold">
              Create Category
            </button>
          </form>
        </div>

        {/* Categories list table */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-primary-500 bg-slate-50 dark:bg-primary-700/50">
                <th className="px-6 py-4 font-bold text-slate-400">Category Name</th>
                <th className="px-6 py-4 font-bold text-slate-400">Slug Reference</th>
                <th className="px-6 py-4 font-bold text-slate-400">Description</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.slug} className="border-b border-slate-100 dark:border-primary-500 last:border-none hover:bg-slate-50/50 dark:hover:bg-primary-600/30">
                  <td className="px-6 py-4 font-bold">{cat.name}</td>
                  <td className="px-6 py-4 font-mono text-accent-blue">{cat.slug}</td>
                  <td className="px-6 py-4 text-slate-400">{cat.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default AdminCategories;
