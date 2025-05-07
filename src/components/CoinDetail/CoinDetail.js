import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import "./CoinDetail.css";

const CoinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coin, setCoin] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cryptoAmount, setCryptoAmount] = useState("1");
  const [usdAmount, setUsdAmount] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Add delay to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const [coinResponse, chartResponse] = await Promise.all([
          fetch(
            `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=true`
          ),
          fetch(
            `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${
              timeframe === "24h"
                ? 1
                : timeframe === "7d"
                ? 7
                : timeframe === "30d"
                ? 30
                : 365
            }`
          ),
        ]);

        if (!coinResponse.ok || !chartResponse.ok) {
          throw new Error("Failed to fetch data from CoinGecko API");
        }

        const coinData = await coinResponse.json();
        const chartData = await chartResponse.json();

        if (coinData.error || chartData.error) {
          throw new Error(coinData.error || chartData.error);
        }

        // Process chart data to reduce number of points for better performance
        const prices = chartData.prices;
        const dataPoints = prices.length;
        const skipPoints = Math.max(1, Math.floor(dataPoints / 100)); // Limit to ~100 points

        const processedData = prices
          .filter((_, index) => index % skipPoints === 0)
          .map((price) => ({
            timestamp: price[0],
            date: new Date(price[0]),
            price: price[1],
          }));

        setCoin(coinData);
        setChartData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error.message || "Failed to fetch coin data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, timeframe]);

  const handleCryptoChange = (value) => {
    setCryptoAmount(value);
    if (value && !isNaN(value) && coin) {
      setUsdAmount(
        (parseFloat(value) * coin.market_data.current_price.usd).toFixed(2)
      );
    } else {
      setUsdAmount("");
    }
  };

  const handleUsdChange = (value) => {
    setUsdAmount(value);
    if (value && !isNaN(value) && coin) {
      setCryptoAmount(
        (parseFloat(value) / coin.market_data.current_price.usd).toFixed(8)
      );
    } else {
      setCryptoAmount("");
    }
  };

  const isPositiveChange = coin?.market_data?.price_change_percentage_24h > 0;
  const lineColor = isPositiveChange ? "#4cd787" : "#ff5c75";
  const gradientColor = isPositiveChange ? "#4cd787" : "#ff5c75";

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    if (timeframe === "24h") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else if (timeframe === "7d") {
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        hour12: true,
      });
    } else if (timeframe === "30d") {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        year: "2-digit",
      });
    }
  };

  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading {id} data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="error-container">
        <h3>Coin Not Found</h3>
        <p>The requested coin could not be found.</p>
        <button onClick={() => navigate(-1)} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="coin-detail-container">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>

      <div className="coin-header">
        <div className="coin-title">
          <img src={coin.image.large} alt={coin.name} />
          <div>
            <h1>
              {coin.name} ({coin.symbol.toUpperCase()})
            </h1>
            <p className="coin-rank">Rank #{coin.market_cap_rank}</p>
          </div>
        </div>
        <div className="coin-price-container">
          <div className="current-price">
            <h2>${coin.market_data.current_price.usd.toLocaleString()}</h2>
            <span
              className={
                coin.market_data.price_change_percentage_24h > 0
                  ? "positive"
                  : "negative"
              }
            >
              {coin.market_data.price_change_percentage_24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="converter-section">
        <div className="converter-card">
          <h3>Currency Converter</h3>
          <div className="converter-grid">
            <div className="converter-input">
              <label>{coin.symbol.toUpperCase()}</label>
              <input
                type="number"
                value={cryptoAmount}
                onChange={(e) => handleCryptoChange(e.target.value)}
                placeholder={`Enter ${coin.symbol.toUpperCase()} amount`}
              />
            </div>
            <div className="converter-equals">=</div>
            <div className="converter-input">
              <label>USD</label>
              <input
                type="number"
                value={usdAmount}
                onChange={(e) => handleUsdChange(e.target.value)}
                placeholder="Enter USD amount"
              />
            </div>
          </div>
          <p className="converter-rate">
            1 {coin.symbol.toUpperCase()} = $
            {coin.market_data.current_price.usd.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3>Price Chart</h3>
          <div className="timeframe-selector">
            {["24h", "7d", "30d", "1y"].map((time) => (
              <button
                key={time}
                className={timeframe === time ? "active" : ""}
                onClick={() => setTimeframe(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e8" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#000000"
              tick={{ fill: "#000000", fontSize: 12 }}
              axisLine={{ stroke: "#000000" }}
              minTickGap={30}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={formatYAxis}
              stroke="#000000"
              tick={{ fill: "#000000", fontSize: 12 }}
              axisLine={{ stroke: "#000000" }}
              width={80}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const date = new Date(payload[0].payload.timestamp);
                  return (
                    <div className="custom-tooltip">
                      <p className="date">
                        {date.toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                      <p className="price">
                        ${payload[0].value.toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="coin-stats-grid">
        <div className="stat-card">
          <h4>Market Cap</h4>
          <p>${coin.market_data.market_cap.usd.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h4>24h Volume</h4>
          <p>${coin.market_data.total_volume.usd.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h4>Circulating Supply</h4>
          <p>
            {coin.market_data.circulating_supply.toLocaleString()}{" "}
            {coin.symbol.toUpperCase()}
          </p>
        </div>
        <div className="stat-card">
          <h4>Total Supply</h4>
          <p>
            {coin.market_data.total_supply
              ? coin.market_data.total_supply.toLocaleString()
              : "N/A"}{" "}
            {coin.symbol.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="coin-info-section">
        <div className="coin-description">
          <h3>About {coin.name}</h3>
          <div dangerouslySetInnerHTML={{ __html: coin.description.en }} />
        </div>

        <div className="additional-info">
          <h3>Additional Information</h3>
          <div className="info-grid">
            <div>
              <h4>Official Links</h4>
              <ul>
                {coin.links?.homepage?.[0] && (
                  <li>
                    <a
                      href={coin.links.homepage[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Website
                    </a>
                  </li>
                )}
                {coin.links?.blockchain_site?.filter(Boolean)[0] && (
                  <li>
                    <a
                      href={coin.links.blockchain_site[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Explorer
                    </a>
                  </li>
                )}
                {coin.links?.official_forum_url?.filter(Boolean)[0] && (
                  <li>
                    <a
                      href={coin.links.official_forum_url[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Forum
                    </a>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4>Social Media</h4>
              <ul>
                {coin.links?.twitter_screen_name && (
                  <li>
                    <a
                      href={`https://twitter.com/${coin.links.twitter_screen_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Twitter
                    </a>
                  </li>
                )}
                {coin.links?.subreddit_url && (
                  <li>
                    <a
                      href={coin.links.subreddit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Reddit
                    </a>
                  </li>
                )}
                {coin.links?.telegram_channel_identifier && (
                  <li>
                    <a
                      href={`https://t.me/${coin.links.telegram_channel_identifier}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Telegram
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;
