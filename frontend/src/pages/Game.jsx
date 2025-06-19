import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { startGame, getGameState, addBots } from '../api/gameApi';
import styles from './Game.module.css';

export default function Game() {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const playerId = location.state?.playerId;

  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [botCount, setBotCount] = useState(1);
  const [botAdding, setBotAdding] = useState(false);
  const [loading, setLoading] = useState(false);  

  useEffect(() => {
    const fetchState = async () => {
      try {
        const state = await getGameState(gameId);
        console.log("🧠 Estado completo:", state);

        setPlayers(
          state.players.map((p) => ({
            name: p.name,
            vip: p.id === 0 && p.isHuman,
            isBot: p.isBot,
          }))
        );

        if (state.gameState === 'in_progress') {
          navigate(`/match/${gameId}`, {
            state: { playerId }
          });
        }
      } catch (err) {
        console.error('Error actualizando estado del juego', err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [gameId, navigate, playerId]);

  const handleStartGame = async () => {
    setLoading(true);
    try {
      await startGame(gameId);
      navigate(`/match/${gameId}`, {
        state: { playerId }
      });
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('No se pudo iniciar la partida. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBots = async () => {
    if (botCount < 1 || botCount > 10) return;
    setBotAdding(true);
    try {
      await addBots(gameId, botCount, 'smart', 'Bot');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al añadir bots.');
      }
    } finally {
      setBotAdding(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.lobbyCode}>LOBBY CODE:</h2>
        <h1 className={styles.lobbyCode}>{gameId?.toUpperCase()}</h1>

        <p className={styles.subtext}>
          Copia y comparte este código con otros jugadores para unirse
        </p>

        <input
          type="text"
          value={`http://localhost:5173/game/${gameId}`}
          readOnly
          className={styles.linkInput}
        />

        <div className={styles.playersBox}>
          <h3 style={{ textAlign: 'left', marginBottom: '1rem', color: '#fff' }}>
            Jugadores ({players.length}/10)
          </h3>

          <div className={styles.playersGrid}>
            {players.map((player, index) => (
              <div key={index} className={styles.playerCard}>
                <div className={styles.avatar} />
                <strong>{player.name}</strong>
                {player.vip && <span className={styles.vip}>★</span>}
                {player.isBot && <span className={styles.botIcon}>🤖</span>}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sectionSpacing}>
          <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Agregar bots</h4>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <input
              type="number"
              min={1}
              max={10}
              value={botCount}
              onChange={(e) => setBotCount(parseInt(e.target.value))}
              className={styles.botInput}
            />
            <button
              onClick={handleAddBots}
              disabled={botAdding}
              className={styles.buttonPrimary}
            >
              {botAdding ? 'Añadiendo...' : 'Agregar'}
            </button>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleStartGame}
            disabled={loading}
            className={styles.buttonPrimary}
          >
            {loading ? 'Iniciando...' : 'EMPEZAR PARTIDA'}
          </button>

          <Link to="/" className={styles.buttonSecondary}>
            VOLVER AL INICIO
          </Link>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
