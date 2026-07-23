import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customersAPI } from '../../api/services';
import { Customer } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

const CustomerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    mobile_number: '',
    email: '',
    business_name: '',
    gst_number: '',
    customer_type: 'Retail' as 'Retail' | 'Wholesale' | 'Distributor',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    status: 'Lead' as 'Lead' | 'Active' | 'Inactive',
    follow_up_date: '',
    notes: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchCustomer(parseInt(id));
    }
  }, [id, isEdit]);

  const fetchCustomer = async (customerId: number) => {
    setLoading(true);
    try {
      const response = await customersAPI.getById(customerId);
      const customer = response.data.data;
      setFormData({
        customer_name: customer.customer_name || '',
        mobile_number: customer.mobile_number || '',
        email: customer.email || '',
        business_name: customer.business_name || '',
        gst_number: customer.gst_number || '',
        customer_type: customer.customer_type || 'Retail',
        address_line1: customer.address_line1 || '',
        address_line2: customer.address_line2 || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        status: customer.status || 'Lead',
        follow_up_date: customer.follow_up_date ? customer.follow_up_date.split('T')[0] : '',
        notes: customer.notes || '',
      });
    } catch (err) {
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = { ...formData };
      if (!payload.email) delete (payload as any).email;
      if (!payload.gst_number) delete (payload as any).gst_number;
      if (!payload.follow_up_date) delete (payload as any).follow_up_date;

      if (isEdit && id) {
        await customersAPI.update(parseInt(id), payload);
      } else {
        await customersAPI.create(payload);
      }
      navigate('/customers');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to save customer';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Customer' : 'Add New Customer'}</h1>
          <p className="breadcrumb">
            <span style={{ cursor: 'pointer', color: '#4F46E5' }} onClick={() => navigate('/customers')}>Customers</span>
            {' / '}{isEdit ? 'Edit' : 'New'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/customers')}>
          <FiArrowLeft /> Back
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', color: '#334155' }}>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name *</label>
                <input type="text" name="customer_name" className="form-control" value={formData.customer_name}
                  onChange={handleChange} required placeholder="Enter customer name" />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input type="text" name="mobile_number" className="form-control" value={formData.mobile_number}
                  onChange={handleChange} required placeholder="10-digit mobile number" maxLength={10} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" className="form-control" value={formData.email}
                  onChange={handleChange} placeholder="email@example.com" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Business Name</label>
                <input type="text" name="business_name" className="form-control" value={formData.business_name}
                  onChange={handleChange} placeholder="Company/Business name" />
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <input type="text" name="gst_number" className="form-control" value={formData.gst_number}
                  onChange={handleChange} placeholder="22AAAAA0000A1Z5" maxLength={15} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Customer Type *</label>
                <select name="customer_type" className="form-control" value={formData.customer_type} onChange={handleChange}>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Follow-up Date</label>
                <input type="date" name="follow_up_date" className="form-control" value={formData.follow_up_date}
                  onChange={handleChange} />
              </div>
            </div>

            <h3 style={{ marginBottom: 16, marginTop: 24, fontSize: '1rem', color: '#334155' }}>Address</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Address Line 1</label>
                <input type="text" name="address_line1" className="form-control" value={formData.address_line1}
                  onChange={handleChange} placeholder="Street address" />
              </div>
              <div className="form-group">
                <label>Address Line 2</label>
                <input type="text" name="address_line2" className="form-control" value={formData.address_line2}
                  onChange={handleChange} placeholder="Apartment, suite, etc." />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" className="form-control" value={formData.city}
                  onChange={handleChange} placeholder="City" />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" name="state" className="form-control" value={formData.state}
                  onChange={handleChange} placeholder="State" />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input type="text" name="pincode" className="form-control" value={formData.pincode}
                  onChange={handleChange} placeholder="6-digit pincode" maxLength={6} />
              </div>
            </div>

            <h3 style={{ marginBottom: 16, marginTop: 24, fontSize: '1rem', color: '#334155' }}>Notes</h3>
            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" className="form-control" value={formData.notes}
                onChange={handleChange} placeholder="Any additional notes..." rows={4} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : (isEdit ? 'Update Customer' : 'Create Customer')}
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/customers')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
