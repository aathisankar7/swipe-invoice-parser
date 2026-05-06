import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  invoices: [],
  products: [],
  customers: [],
  errors: [],
  loading: false,
};

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setData(state, action) {
      const { invoices, products, customers, errors } = action.payload;
      state.invoices = invoices || [];
      state.products = products || [];
      state.customers = customers || [];
      state.errors = errors || [];
    },
    clearData(state) {
      state.invoices = [];
      state.products = [];
      state.customers = [];
      state.errors = [];
    },
    updateProduct(state, action) {
      const { index, field, value } = action.payload;
      if (state.products[index]) {
        state.products[index][field] = value;
      }
    },
    updateCustomer(state, action) {
      const { index, field, value } = action.payload;
      if (state.customers[index]) {
        const oldName = state.customers[index].name;
        state.customers[index][field] = value;
        
        if (field === 'name') {
          state.invoices.forEach((inv) => {
            if (inv.customerName === oldName) {
              inv.customerName = value;
            }
          });
          state.products.forEach((p) => {
            if (p.customerName === oldName) {
              p.customerName = value;
            }
          });
        }
      }
    },
    updateInvoice(state, action) {
      const { index, field, value } = action.payload;
      if (state.invoices[index]) {
        const oldValue = state.invoices[index][field];
        state.invoices[index][field] = value;

        if (field === 'customerName' && oldValue !== value) {
          state.customers.forEach((c) => {
            if (c.name === oldValue) {
              c.name = value;
            }
          });
          state.products.forEach((p) => {
            if (p.customerName === oldValue) {
              p.customerName = value;
            }
          });
        }
      }
    },
  },
});

export const { setLoading, setData, clearData, updateProduct, updateCustomer, updateInvoice } =
  invoiceSlice.actions;
export default invoiceSlice.reducer;
