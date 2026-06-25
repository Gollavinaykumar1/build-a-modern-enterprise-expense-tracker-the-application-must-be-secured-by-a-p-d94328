import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { BiCalculator } from 'react-icons/bi';
import { AiOutlineLogin, AiOutlineRegister } from 'react-icons/ai';
import { FaPlus } from 'react-icons/fa';
import { RiDeleteBin2Line } from 'react-icons/ri';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { clsx } from 'clsx';
import { login, register, getItems, createItem } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const sampleData = [
  { id: 1, title: 'Expense 1', category: 'Food', amount: 10.99, status: 'Approved' },
  { id: 2, title: 'Expense 2', category: 'Transportation', amount: 20.99, status: 'Pending' },
  { id: 3, title: 'Expense 3', category: 'Entertainment', amount: 30.99, status: 'Rejected' },
];

const App = () => {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState(sampleData);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('');
  const [calculatorHistory, setCalculatorHistory] = useState([]);

  const {
    register: registerForm,
    handleSubmit: handleSubmitRegister,
    formState: { errors: registerErrors },
  } = useForm();

  const {
    register: loginForm,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm();

  const handleRegister = useCallback(async (data) => {
    try {
      const response = await register(data);
      setUser(response.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleLogin = useCallback(async (data) => {
    try {
      const response = await login(data);
      setUser(response.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleGetItems = useCallback(async () => {
    try {
      const response = await getItems();
      const safeList = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      setExpenses(safeList);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleCreateItem = useCallback(async (data) => {
    try {
      const response = await createItem(data);
      setExpenses((prevExpenses) => [...prevExpenses, response.data]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    handleGetItems();
  }, [handleGetItems]);

  const handleAddExpense = useCallback((data) => {
    handleCreateItem(data);
    setShowAddExpenseModal(false);
  }, [handleCreateItem]);

  const handleCalculatorInput = useCallback((value) => {
    setCalculatorValue(value);
  }, []);

  const handleCalculatorOperator = useCallback((operator) => {
    setCalculatorValue((prevValue) => `${prevValue} ${operator} `);
  }, []);

  const handleCalculatorEquals = useCallback(() => {
    const result = eval(calculatorValue);
    setCalculatorHistory((prevHistory) => [...prevHistory, calculatorValue + ' = ' + result]);
    setCalculatorValue(result.toString());
  }, [calculatorValue]);

  const handleCalculatorClear = useCallback(() => {
    setCalculatorValue('');
    setCalculatorHistory([]);
  }, []);

  if (!user) {
    return (
      <div className="app-wrapper">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex h-screen justify-center items-center">
                <div className="bg-gray-800 p-10 rounded-lg shadow-lg">
                  <h1 className="text-3xl font-bold text-white mb-4">Login or Register</h1>
                  <div className="flex justify-between">
                    <button
                      className={clsx(
                        'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                        'transition-all duration-300 hover:scale-105'
                      )}
                      onClick={() => {
                        window.location.href = '/login';
                      }}
                    >
                      <AiOutlineLogin className="mr-2" />
                      Login
                    </button>
                    <button
                      className={clsx(
                        'bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded',
                        'transition-all duration-300 hover:scale-105'
                      )}
                      onClick={() => {
                        window.location.href = '/register';
                      }}
                    >
                      <AiOutlineRegister className="mr-2" />
                      Register
                    </button>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div className="flex h-screen justify-center items-center">
                <div className="bg-gray-800 p-10 rounded-lg shadow-lg">
                  <h1 className="text-3xl font-bold text-white mb-4">Login</h1>
                  <form onSubmit={handleSubmitLogin(handleLogin)}>
                    <div className="mb-4">
                      <input
                        type="email"
                        className={clsx(
                          'bg-gray-700 text-white p-2 rounded',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                        {...loginForm('email', { required: true })}
                        placeholder="Email"
                      />
                      {loginErrors.email && (
                        <p className="text-red-500 mt-2">{loginErrors.email.message}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <input
                        type="password"
                        className={clsx(
                          'bg-gray-700 text-white p-2 rounded',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                        {...loginForm('password', { required: true })}
                        placeholder="Password"
                      />
                      {loginErrors.password && (
                        <p className="text-red-500 mt-2">{loginErrors.password.message}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className={clsx(
                        'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                        'transition-all duration-300 hover:scale-105'
                      )}
                    >
                      Login
                    </button>
                  </form>
                </div>
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="flex h-screen justify-center items-center">
                <div className="bg-gray-800 p-10 rounded-lg shadow-lg">
                  <h1 className="text-3xl font-bold text-white mb-4">Register</h1>
                  <form onSubmit={handleSubmitRegister(handleRegister)}>
                    <div className="mb-4">
                      <input
                        type="email"
                        className={clsx(
                          'bg-gray-700 text-white p-2 rounded',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                        {...registerForm('email', { required: true })}
                        placeholder="Email"
                      />
                      {registerErrors.email && (
                        <p className="text-red-500 mt-2">{registerErrors.email.message}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <input
                        type="password"
                        className={clsx(
                          'bg-gray-700 text-white p-2 rounded',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                        {...registerForm('password', { required: true })}
                        placeholder="Password"
                      />
                      {registerErrors.password && (
                        <p className="text-red-500 mt-2">{registerErrors.password.message}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className={clsx(
                        'bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded',
                        'transition-all duration-300 hover:scale-105'
                      )}
                    >
                      Register
                    </button>
                  </form>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex h-screen flex-col">
              <div className="bg-gray-800 p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Expense Tracker</h1>
                <button
                  className={clsx(
                    'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                    'transition-all duration-300 hover:scale-105'
                  )}
                  onClick={() => setShowAddExpenseModal(true)}
                >
                  <FaPlus className="mr-2" />
                  Add Expense
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-2">Total Expenses</h2>
                    <p className="text-3xl font-bold text-white">
                      ${expenses.reduce((acc, expense) => acc + expense.amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-2">Pending Approvals</h2>
                    <p className="text-3xl font-bold text-white">
                      {expenses.filter((expense) => expense.status === 'Pending').length}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-2">Monthly Budget Remaining</h2>
                    <p className="text-3xl font-bold text-white">
                      ${1000 - expenses.reduce((acc, expense) => acc + expense.amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <table className="w-full text-white">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-4 py-2">{expense.title}</td>
                        <td className="px-4 py-2">{expense.category}</td>
                        <td className="px-4 py-2">${expense.amount.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <span
                            className={clsx(
                              'px-2 py-1 rounded',
                              expense.status === 'Approved' ? 'bg-green-500' : '',
                              expense.status === 'Pending' ? 'bg-yellow-500' : '',
                              expense.status === 'Rejected' ? 'bg-red-500' : ''
                            )}
                          >
                            {expense.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddExpenseModal && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
                  <div className="bg-gray-800 p-10 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-white mb-4">Add Expense</h1>
                    <form onSubmit={handleSubmit(handleAddExpense)}>
                      <div className="mb-4">
                        <input
                          type="text"
                          className={clsx(
                            'bg-gray-700 text-white p-2 rounded',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                          {...register('title', { required: true })}
                          placeholder="Title"
                        />
                        {errors.title && (
                          <p className="text-red-500 mt-2">{errors.title.message}</p>
                        )}
                      </div>
                      <div className="mb-4">
                        <input
                          type="text"
                          className={clsx(
                            'bg-gray-700 text-white p-2 rounded',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                          {...register('category', { required: true })}
                          placeholder="Category"
                        />
                        {errors.category && (
                          <p className="text-red-500 mt-2">{errors.category.message}</p>
                        )}
                      </div>
                      <div className="mb-4">
                        <input
                          type="number"
                          className={clsx(
                            'bg-gray-700 text-white p-2 rounded',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                          )}
                          {...register('amount', { required: true })}
                          placeholder="Amount"
                        />
                        {errors.amount && (
                          <p className="text-red-500 mt-2">{errors.amount.message}</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className={clsx(
                          'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                          'transition-all duration-300 hover:scale-105'
                        )}
                      >
                        Add Expense
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </Routes>
      <ToastContainer />
    </div>
  );
};

export default App;