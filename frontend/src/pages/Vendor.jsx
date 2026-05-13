import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, addVendor, deleteVendor } from '../redux/slices/vendorSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Vendor = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.vendor);
  const [open, setOpen] = useState(false);

  useEffect(() => { dispatch(fetchVendors()); }, [dispatch]);

  const formik = useFormik({
    initialValues: { name: '', contact: '' },
    validationSchema: Yup.object({ name: Yup.string().required('Required'), contact: Yup.string().required('Required') }),
    onSubmit: async (vals, { resetForm }) => {
      await dispatch(addVendor(vals));
      resetForm(); setOpen(false);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[13px] font-bold text-gray-900 dark:text-white">Supplier Management</h1>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 shadow-sm transition-colors">
          Add Vendor
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(loading ? [] : items).map((v) => (
          <div key={v.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xl dark:bg-brand-900/20 dark:text-brand-400">
                  {v.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{v.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{v.contact}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => dispatch(deleteVendor(v.id))} className="text-red-500">Delete</button>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Products</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{v.productCount || 0}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active POs</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{v.activePoCount || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl dark:bg-gray-800">
            <h3 className="text-[13px] font-semibold mb-4">Add Supplier</h3>
            <div className="space-y-3">
              <input {...formik.getFieldProps('name')} placeholder="Vendor name" className="w-full rounded-xl border px-3 py-2" />
              <input {...formik.getFieldProps('contact')} placeholder="Contact email/phone" className="w-full rounded-xl border px-3 py-2" />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setOpen(false)} className="px-4 py-2">Cancel</button>
                <button onClick={() => formik.handleSubmit()} className="px-4 py-2 rounded bg-brand-600 text-white">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendor;
