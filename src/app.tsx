import { useEffect } from 'preact/hooks';
import { useGameStore } from './store/gameStore';
import './app.css';

export function App() {
  const {
    gameState,
    initializeGame,
    getCurrentLocation,
    getLocationChildren,
    getLocationSiblings,
    getLocationPath,
    moveUp,
    enterObject,
    getResolvedType,
  } = useGameStore();

  useEffect(() => {
    initializeGame();
  }, []);

  const location = getCurrentLocation();
  const children = getLocationChildren();
  const siblings = getLocationSiblings();
  const path = getLocationPath();

  if (!gameState || !location) {
    return <div class="loading">Loading...</div>;
  }

  const locationType = getResolvedType(location.typeId);

  return (
    <div class="game-screen">
      <header class="header">
        <h1>Open Universe</h1>
        <div class="breadcrumb">
          {path.map((obj, i) => (
            <span key={obj.id}>
              {i > 0 && ' > '}
              <button
                class="breadcrumb-link"
                onClick={() => useGameStore.getState().movePlayer(obj.id)}
              >
                {obj.name}
              </button>
            </span>
          ))}
        </div>
      </header>

      <main class="main-view">
        <div class="location-info">
          <pre class="ascii-art" style={{ color: locationType?.color || '#fff' }}>
            {locationType?.ascii || '?'}
          </pre>
          <h2>{location.name}</h2>
          <p class="type-label">{locationType?.name || location.typeId}</p>
        </div>

        <div class="navigation-panel">
          {location.parentId && (
            <div class="nav-section">
              <h3>Parent</h3>
              <button class="nav-item" onClick={moveUp}>
                ^ {gameState.objects[location.parentId]?.name || 'Up'}
              </button>
            </div>
          )}

          {siblings.length > 0 && (
            <div class="nav-section">
              <h3>Siblings ({siblings.length})</h3>
              <div class="object-list">
                {siblings.map((obj) => {
                  const objType = getResolvedType(obj.typeId);
                  return (
                    <button
                      key={obj.id}
                      class="nav-item"
                      onClick={() => useGameStore.getState().movePlayer(obj.id)}
                    >
                      <span class="obj-icon" style={{ color: objType?.color }}>
                        {objType?.ascii?.charAt(0) || '?'}
                      </span>
                      {obj.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {children.length > 0 && (
            <div class="nav-section">
              <h3>Contains ({children.length})</h3>
              <div class="object-list">
                {children.map((obj) => {
                  const objType = getResolvedType(obj.typeId);
                  const canEnter = objType && objType.defaultCapacity > 0;
                  return (
                    <button
                      key={obj.id}
                      class={`nav-item ${canEnter ? 'enterable' : ''}`}
                      onClick={() => canEnter && enterObject(obj.id)}
                      disabled={!canEnter}
                    >
                      <span class="obj-icon" style={{ color: objType?.color }}>
                        {objType?.ascii?.charAt(0) || '?'}
                      </span>
                      {obj.name}
                      {canEnter && <span class="enter-hint">[Enter]</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer class="action-bar">
        <span class="status">
          Objects: {Object.keys(gameState.objects).length} |
          Location: {location.name}
        </span>
      </footer>
    </div>
  );
}
