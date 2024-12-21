import React, { useState, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { createStore } from 'redux';
import GridLayout from 'react-grid-layout';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './App.css';
import './styles.css'; 
const initialState = {
    layout: JSON.parse(localStorage.getItem('dashboardLayout')) || [
        { i: '1', x: 0, y: 0, w: 4, h: 2 },
        { i: '2', x: 4, y: 0, w: 4, h: 2 },
        { i: '3', x: 8, y: 0, w: 4, h: 2 },
    ],
    theme: localStorage.getItem('theme') || 'light',
    data: [],
};

function dashboardReducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_LAYOUT':
            return { ...state, layout: action.payload };
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'SET_DATA':
            return { ...state, data: action.payload };
        default:
            return state;
    }
}

const store = createStore(dashboardReducer);
const fetchCryptoData = async (dispatch) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd');
        dispatch({ type: 'SET_DATA', payload: response.data });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};
const App = () => {
    const dispatch = useDispatch();
    const layout = useSelector((state) => state.layout);
    const theme = useSelector((state) => state.theme);
    const data = useSelector((state) => state.data);

    useEffect(() => {
        fetchCryptoData(dispatch);
        const interval = setInterval(() => fetchCryptoData(dispatch), 5000);
        return () => clearInterval(interval);
    }, [dispatch]);

    const saveLayout = (layout) => {
        dispatch({ type: 'SET_LAYOUT', payload: layout });
        localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        dispatch({ type: 'SET_THEME', payload: newTheme });
        localStorage.setItem('theme', newTheme);
    };

    const renderSummaryCard = () => {
        if (!data.length) return <p>Loading...</p>;

        const highestPrice = Math.max(...data.map((coin) => coin.current_price));
        const lowestPrice = Math.min(...data.map((coin) => coin.current_price));
        const avgMarketCap = (
            data.reduce((sum, coin) => sum + coin.market_cap, 0) / data.length
        ).toFixed(2);

        return (
            <div>
                <h3>Summary</h3>
                <p>Highest Price: ${highestPrice}</p>
                <p>Lowest Price: ${lowestPrice}</p>
                <p>Average Market Cap: ${avgMarketCap}</p>
            </div>
        );
    };

    const renderTable = () => {
        if (!data.length) return <p>Loading...</p>;

        return (
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Market Cap</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((coin) => (
                        <tr key={coin.id}>
                            <td>{coin.name}</td>
                            <td>${coin.current_price}</td>
                            <td>${coin.market_cap}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderGraph = () => {
        if (!data.length) return <p>Loading...</p>;

        const chartData = data.map((coin) => ({
            name: coin.name,
            price: coin.current_price,
        }));

        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className={`app ${theme}`}>
            <button onClick={toggleTheme}>Toggle Theme</button>
            <GridLayout
                className="layout"
                layout={layout}
                cols={12}
                rowHeight={100}
                width={1200}
                onLayoutChange={(layout) => saveLayout(layout)}
            >
                <div key="1" className="grid-item">{renderSummaryCard()}</div>
                <div key="2" className="grid-item">{renderTable()}</div>
                <div key="3" className="grid-item">{renderGraph()}</div>
            </GridLayout>
        </div>
    );
};

const Root = () => (
    <Provider store={store}>
        <App />
    </Provider>
);

export default Root;

