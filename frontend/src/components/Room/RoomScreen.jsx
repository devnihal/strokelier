import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket";
import { usePlayerSession } from "../../context/PlayerSessionContext";
import LobbyScreen from "./LobbyScreen";
import CanvasScreen from "./CanvasScreen";
import VotingScreen from "./VotingScreen";
import ResultsScreen from "./ResultsScreen";
import { log } from "../../utils/logger";
import LeaderboardScreen from "./LeaderboardScreen";
import "../../styles/Room/RoomScreen.css";

function CountdownOverlay({ seconds, message, onComplete }) {
  const [count, setCount] = useState(seconds);

  const onCompleteRef = React.useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (count <= 0) {
      onCompleteRef.current();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="countdown-overlay">
      <div className="countdown-content">
        <p className="countdown-msg">{message}</p>
        <h1 className="countdown-number" key={count}>
          {count > 0 ? count : ""}
        </h1>
      </div>
    </div>
  );
}

export default function RoomScreen() {
  const { code } = useParams();
  const socket = useSocket();
  const { uid } = usePlayerSession();
  const navigate = useNavigate();

  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState(null);

  // Transition state
  const [displayedState, setDisplayedState] = useState(null);
  const [countdown, setCountdown] = useState(null); // { seconds, message, targetState }
  const [fadeClass, setFadeClass] = useState("fade-in");

  const [needsName, setNeedsName] = useState(false);
  const [tempName, setTempName] = useState('');

  const [roleInfo, setRoleInfo] = useState(null); // { role, word }
  const [showRolePopup, setShowRolePopup] = useState(false);

  // Derived state to determine if current user is a spectator
  const isSpectator = roomState && roomState.spectators && !!roomState.spectators[uid];

  useEffect(() => {
    if (!socket || !code) return;

    const savedName = localStorage.getItem("strokelier_name");
    
    if (!savedName) {
      setNeedsName(true);
      return;
    }

    joinRoom(savedName);
  }, [socket, code]);

  const joinRoom = (playerName) => {
    socket.emit(
      "ROOM_JOIN",
      { roomCode: code, name: playerName },
      (response) => {
        if (response.success === false && response.error) {
          setError(response.error);
        } else if (response.error) {
          setError(response.error);
        } else {
          setRoomState(response.state);
          setDisplayedState(response.state.state);
        }
      }
    );
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      localStorage.setItem("strokelier_name", tempName.trim());
      setNeedsName(false);
      joinRoom(tempName.trim());
    }
  };

  useEffect(() => {
    if (!socket || !code) return;
    
    const handleStateUpdate = (newState) => {
      // Check for injected rolesMap from GAME_START
      if (newState.rolesMap && newState.rolesMap[uid]) {
        log("Extracted role info from ROOM_STATE_UPDATE:", newState.rolesMap[uid]);
        setRoleInfo(newState.rolesMap[uid]);
      }

      setRoomState((prev) => {
        if (!prev) return newState;

        // Check for state transitions to trigger countdowns
        if (prev.state === "LOBBY" && newState.state === "DRAWING") {
          setCountdown({
            seconds: 5,
            message: "GAME STARTS IN",
            targetState: "DRAWING",
          });
        } else if (prev.state === "DRAWING" && newState.state === "VOTING") {
          setCountdown({
            seconds: 3,
            message: "PREPARE TO ACCUSE",
            targetState: "VOTING",
          });
        } else if (prev.state === "VOTING" && newState.state === "RESULTS") {
          setCountdown({
            seconds: 3,
            message: "RESULTS IN",
            targetState: "RESULTS",
          });
        } else if (prev.state !== newState.state && !countdown) {
          // Clear roleInfo if returning to LOBBY
          if (newState.state === "LOBBY") {
            setRoleInfo(null);
          }
          // Normal crossfade for other state changes
          setFadeClass("fade-out");
          setTimeout(() => {
            setDisplayedState(newState.state);
            setFadeClass("fade-in");
          }, 300); // 300ms fade
        }
        return newState;
      });
    };

    socket.on("ROOM_STATE_UPDATE", handleStateUpdate);
    
    const handleReconnect = () => {
      const savedName = localStorage.getItem("strokelier_name");
      if (savedName) joinRoom(savedName);
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.emit("ROOM_LEAVE");
      socket.off("ROOM_STATE_UPDATE", handleStateUpdate);
      socket.off("connect", handleReconnect);
    };
  }, [socket, code, uid]);

  // Removed obsolete useEffect that was setting setIsSpectator(false)

  if (needsName) {
    return (
      <div className="room-screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--bone)', marginBottom: '16px' }}>Identify Yourself</h2>
          <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--bone-muted)', marginBottom: '32px' }}>Joining Room {code}</p>
          <form onSubmit={handleNameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              autoFocus
              className="name-input"
              style={{ margin: '0 auto', display: 'block', width: '100%', maxWidth: '280px', background: 'var(--studio-wall-alt)', border: '1px solid var(--hairline)', color: 'var(--bone)', fontFamily: 'var(--font-hand)', fontSize: '16px', padding: '12px 14px', textAlign: 'center', outline: 'none' }}
              placeholder="ENTER ARTIST ALIAS"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!tempName.trim()}
              style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: '14px', background: 'transparent', border: '1px solid var(--brass)', color: 'var(--brass)', padding: '14px 28px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', width: 'max-content', margin: '0 auto' }}
            >
              Enter Atelier
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-screen-container">
        <div className="modal-scrim open" style={{ zIndex: 100 }}>
          <div className="shape-citadel play theme-word" style={{ maxWidth: '400px', width: '90%', border: '1px solid var(--brass)' }}>
            <span className="popup-header-label">Error</span>
            <div style={{ padding: "32px 24px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--graphite)", marginBottom: "32px" }}>
                {error}
              </p>
              <button onClick={() => window.location.href = '/'} style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: '14px', background: 'transparent', border: '1px solid var(--brass)', color: 'var(--brass)', padding: '14px 28px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!roomState || !displayedState) {
    return <div className="room-loading">Connecting to Atelier...</div>;
  }

  const isOwner = roomState.ownerUid === uid;
  const myPlayer = roomState.players[uid];

  const handleCountdownComplete = () => {
    // If transitioning to DRAWING and we have role info, show the role popup
    if (countdown.targetState === "DRAWING" && roleInfo) {
      setCountdown(null);
      setShowRolePopup(true);
      return;
    }
    setFadeClass("fade-out");
    setTimeout(() => {
      setDisplayedState(countdown.targetState);
      setCountdown(null);
      setFadeClass("fade-in");
    }, 300);
  };

  const handleDismissRolePopup = () => {
    setShowRolePopup(false);
    setFadeClass("fade-out");
    setTimeout(() => {
      setDisplayedState("DRAWING");
      setFadeClass("fade-in");
    }, 300);
  };

  const renderScreen = () => {
    switch (displayedState) {
      case "LOBBY":
        return (
          <LobbyScreen
            roomState={roomState}
            isOwner={isOwner}
            myPlayer={myPlayer}
            socket={socket}
          />
        );
      case "DRAWING":
        return (
          <CanvasScreen
            roomState={roomState}
            myPlayer={myPlayer}
            socket={socket}
            roleInfo={roleInfo}
          />
        );
      case "VOTING":
        return (
          <VotingScreen
            roomState={roomState}
            myPlayer={myPlayer}
            socket={socket}
          />
        );
      case "RESULTS":
        return (
          <ResultsScreen
            roomState={roomState}
            myPlayer={myPlayer}
            socket={socket}
          />
        );
      case "LEADERBOARD":
        return (
          <LeaderboardScreen
            roomState={roomState}
            myPlayer={myPlayer}
            socket={socket}
          />
        );
      default:
        return <div>Unknown game state.</div>;
    }
  };

  return (
    <div className="room-screen">
      {isSpectator && (
        <div className="spectator-banner" style={{ background: 'var(--ink-blue)', color: 'var(--bone)', padding: '8px 16px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', width: '100%', zIndex: 100 }}>
          Spectator Mode - You will join the next game
        </div>
      )}
      <div className={`screen-transition-wrapper ${fadeClass}`}>
        {renderScreen()}
      </div>

      {countdown && (
        <CountdownOverlay
          seconds={countdown.seconds}
          message={countdown.message}
          onComplete={handleCountdownComplete}
        />
      )}

      {showRolePopup && roleInfo && (
        <div className="modal-scrim open">
          <div className={`shape-citadel play ${roleInfo.role === 'imposter' ? 'theme-role' : 'theme-word'}`}>
            <svg className="doodle-illustration" viewBox="0 0 432 432" fill="none">
              <path fillRule="evenodd" fill="currentColor" d="M206.315369,394.975952 C189.830856,389.969269 173.743546,385.162567 157.093964,382.474121 C152.495895,381.731659 148.268585,379.583832 144.090775,377.443268 C139.282120,374.979523 134.884521,371.845764 131.185410,368.084320 C118.424759,355.108673 103.610962,344.444214 90.687660,331.687378 C82.219650,323.328461 74.947906,314.077789 70.645164,302.739166 C67.912651,295.538452 64.122147,288.727509 59.249157,282.850494 C46.957703,268.026520 43.710365,251.284363 46.848724,232.720337 C48.929535,220.411896 48.198063,208.160172 44.966263,196.080612 C40.535469,179.519531 41.447674,163.464111 49.345276,148.006226 C51.256634,144.265121 53.479836,140.717911 56.202175,137.592133 C66.590881,125.663864 74.971153,112.517639 80.488388,97.683052 C85.854034,83.256042 95.820717,73.840927 110.249809,68.805328 C119.198250,65.682419 126.580750,59.888252 134.016113,54.236301 C135.209549,53.329113 136.261337,52.142521 137.582077,51.509876 C156.574844,42.412243 174.346588,30.439602 195.777603,27.085884 C206.730270,25.371912 217.324585,26.140621 227.602127,30.424700 C230.861023,31.783123 233.526932,33.798298 233.803116,37.563240 C234.081573,41.359512 231.626938,43.674110 228.613266,45.457771 C222.080780,49.324070 214.843658,51.382732 207.583496,53.180138 C185.363632,58.681118 163.396957,64.775101 144.195099,77.940620 C102.802536,106.320930 75.933228,143.475204 71.939201,195.135788 C69.980003,220.476852 72.898514,244.750702 84.266953,267.509644 C92.768715,284.529663 104.468719,299.636475 115.231888,315.269043 C120.441750,322.835938 126.836327,329.442749 133.816132,335.441132 C152.301392,351.327209 173.958282,359.827271 197.826630,363.796906 C231.611877,369.415833 262.001099,360.650787 289.970490,342.384583 C323.035919,320.790222 346.792694,291.330109 358.248688,253.405411 C374.270691,200.365295 360.890381,141.751678 316.229462,103.447945 C304.608276,93.480980 292.870941,83.625427 279.331360,76.173637 C243.926300,56.687744 213.089401,73.615845 196.803940,99.953590 C194.048843,104.409309 191.111023,108.811806 189.239365,114.829269 C195.560730,113.478127 200.990372,112.141464 206.540253,111.445633 C226.953125,108.886314 244.876419,114.820786 260.421539,127.713173 C274.230133,139.165359 277.130035,156.132645 268.364716,169.218460 C261.569824,179.362640 247.494034,183.281128 236.953201,177.962997 C226.245575,172.560715 222.172623,161.416550 226.363419,148.987869 C229.645218,139.254974 225.088699,132.676987 214.672913,132.090836 C210.626007,131.863098 206.704193,132.451477 202.864380,133.729675 C200.494156,134.518661 197.996429,134.854385 197.046753,131.877472 C196.176651,129.149994 198.348022,128.020798 200.475250,127.262192 C208.231140,124.496330 216.009903,123.532494 223.810410,127.151245 C233.023010,131.425095 236.515259,139.140167 233.689941,148.915436 C232.681961,152.402908 231.041473,155.767776 231.709900,159.591431 C233.292358,168.643524 239.172470,173.353302 248.591370,173.042679 C257.182373,172.759369 264.715332,165.728333 265.780121,157.131683 C267.186127,145.780212 262.253235,137.140900 253.461670,130.915054 C233.486923,116.769638 211.900223,114.172226 188.994125,123.204887 C185.032578,124.767075 183.003159,127.274170 182.183319,131.511841 C178.746887,149.274063 184.793137,163.581970 197.690201,175.491074 C206.569321,183.690018 217.088211,189.560349 227.240982,195.929916 C241.923950,205.141632 256.745544,214.214172 269.566498,225.967499 C294.015839,248.380905 292.929596,283.542511 267.874786,305.407074 C253.686249,317.788971 237.354309,324.902679 218.829849,324.935791 C197.155228,324.974579 177.397934,318.604797 162.571014,301.436920 C160.632126,299.191895 158.077499,298.804291 155.495132,298.188202 C141.640686,294.882782 129.461334,288.923645 121.407272,276.499939 C120.775505,275.525421 120.156754,274.526825 119.676247,273.473602 C118.999237,271.989655 118.985222,270.501923 120.465111,269.452057 C122.054039,268.324799 123.697662,268.546722 124.991730,269.893372 C126.135307,271.083435 127.056519,272.493713 128.029114,273.840546 C134.573685,282.903229 143.610535,288.005249 155.327820,290.999329 C152.880188,284.905792 151.206177,279.446503 150.327454,273.760803 C148.221558,260.134918 155.202423,245.580948 167.412796,238.612595 C180.201584,231.314163 196.120743,232.342346 206.853973,241.160019 C219.714172,251.725082 221.413879,269.442963 210.801025,282.607635 C209.361557,284.393219 207.779205,286.063599 206.178345,287.883514 C222.007904,291.856323 236.786591,276.243713 233.190460,259.627014 C230.203918,245.827042 221.197449,236.460693 209.899475,229.026672 C199.327118,222.070084 188.441315,215.590149 177.862778,208.642593 C169.254883,202.989243 162.273666,195.649246 157.012817,186.739868 C148.677444,172.623703 148.588348,158.287918 156.157852,143.910233 C160.565857,135.537582 166.570755,128.416824 174.462677,123.083733 C177.073853,121.319199 178.632080,119.057549 179.957352,116.241394 C187.084457,101.096703 194.930710,86.366005 208.466293,75.768478 C229.670410,59.166943 253.237579,54.770710 277.193970,67.511368 C328.404572,94.746559 364.556396,134.168427 370.785889,194.563171 C375.009613,235.511887 364.219330,272.706665 339.280365,305.780670 C318.115631,333.849243 291.385223,354.193451 258.195740,365.833954 C234.398514,374.180298 210.214417,374.041077 185.800415,368.646881 C149.483185,360.622772 122.122856,340.161224 102.300903,309.089020 C95.045914,297.716339 86.884438,286.947845 80.231239,275.166077 C71.297310,259.345459 66.707298,242.191223 64.956673,224.355301 C62.449310,198.809631 65.977119,173.864700 74.734200,149.731049 C81.980614,129.760635 94.655167,113.333488 109.017860,98.042007 C133.294678,72.195305 163.108902,56.342697 197.518600,48.594818 C204.328506,47.061459 211.002243,44.881264 217.671524,42.785385 C220.460419,41.908955 223.350555,40.936508 225.708176,38.017555 C220.879517,34.550610 215.491104,33.734352 210.123245,33.371113 C195.182404,32.360081 181.503525,36.910965 168.469452,43.659779 C162.255585,46.877213 156.160141,50.309917 149.640274,52.895538 C143.662796,55.266052 138.671478,59.199104 133.758347,63.185303 C127.357689,68.378387 120.452766,72.716339 112.683220,75.422150 C100.413712,79.695099 91.939018,87.683762 87.288445,99.832359 C81.642097,114.582191 73.823586,128.073364 63.487404,140.056076 C49.993000,155.700119 46.590820,173.670135 51.590389,193.351288 C55.256752,207.784180 55.850101,222.181381 53.540401,236.905548 C51.313786,251.100067 53.789146,264.368652 63.034901,276.026886 C69.157990,283.747650 73.940117,292.328308 77.816818,301.440247 C84.408127,316.932739 95.988831,328.411926 108.909515,338.603912 C115.076706,343.468628 121.133339,348.474060 126.467979,354.161407 C139.105042,367.634003 153.672729,376.941071 172.575058,378.593231 C180.386703,379.276031 187.902573,381.715668 195.226028,384.550934 C217.394943,393.133453 239.069992,390.462219 260.364197,381.496979 C276.288239,374.792694 290.471649,365.079346 304.384552,355.002563 C311.679291,349.719238 318.914337,344.338531 326.857483,340.088745 C336.288269,335.043152 343.394897,327.777893 348.451294,318.495850 C354.625092,307.162567 362.792633,297.245636 370.420410,286.942078 C378.032257,276.660034 384.290680,265.735992 386.212555,252.855164 C387.757965,242.497208 386.291718,232.243576 384.340515,222.100433 C381.037048,204.927536 381.279022,187.653931 382.252136,170.327042 C382.750549,161.453171 381.948517,152.696289 379.307251,144.181519 C377.583618,138.625015 374.255676,134.015137 369.901611,130.263535 C357.690735,119.742264 348.214752,107.393410 342.657837,92.070267 C337.753937,78.547752 327.151337,70.917030 313.830109,67.358269 C295.211670,62.384384 277.820862,54.439747 260.290955,46.755192 C258.026367,45.762470 255.770859,44.564751 256.885834,41.637119 C258.019073,38.661480 260.659576,39.341698 262.869049,40.142395 C265.995605,41.275455 269.103149,42.533005 272.062195,44.044003 C286.077332,51.200630 300.893921,56.132378 315.969574,60.483551 C332.129120,65.147568 343.946960,74.986641 349.954224,91.008133 C354.378937,102.808868 361.010040,113.042191 370.773987,121.049751 C384.527252,132.328995 389.293915,147.248932 389.408569,164.435501 C389.500702,178.252838 387.596436,192.073044 389.302582,205.874863 C390.505615,215.606735 391.906494,225.316544 393.372864,235.012955 C396.414673,255.126907 389.570892,272.458038 378.155701,288.353210 C369.318207,300.659027 359.833099,312.476654 352.395386,325.777588 C348.719116,332.351959 343.534119,338.033997 336.955078,341.866455 C319.069427,352.285248 303.170502,365.641998 285.476318,376.321381 C266.707794,387.649200 247.006699,396.160004 224.582474,396.548920 C218.565826,396.653259 212.620361,396.294006 206.315369,394.975952 z M260.291199,227.230988 C250.452866,218.934204 239.546448,212.162247 228.784103,205.187408 C216.913513,197.494324 204.349442,190.791870 193.691025,181.353851 C180.058502,169.282288 172.750305,154.434799 174.516876,135.809387 C174.597916,134.954895 175.107971,133.764679 173.382553,133.166519 C168.979645,136.898117 165.794876,141.723312 162.860931,146.769745 C155.317841,159.743988 155.929810,172.363129 164.145447,184.852112 C169.464172,192.937378 176.271393,199.443878 184.328766,204.652084 C194.399185,211.161453 204.688049,217.336227 214.692276,223.943649 C223.997772,230.089615 231.616714,237.868195 236.664459,248.025223 C248.004623,270.843811 234.712662,295.492035 209.847580,295.256500 C199.508255,295.158569 189.925797,296.306335 180.232300,299.033051 C177.644623,299.760925 174.633804,298.863312 172.105774,301.013153 C172.886353,301.757477 173.452209,302.350922 174.072418,302.880707 C200.153976,325.159149 243.710175,322.222717 266.576569,296.633392 C273.469299,288.919922 278.798798,280.414703 279.800171,269.794006 C281.462158,252.166336 274.812469,238.277115 260.291199,227.230988 z M158.962280,258.634552 C154.934723,269.885468 157.570724,280.219360 163.299469,290.126068 C163.980911,291.304474 164.784164,292.454681 166.239868,292.604858 C173.398285,293.343231 180.356293,292.696625 188.713379,289.086853 C185.990738,286.862091 183.856567,285.519104 182.233032,283.716248 C177.400009,278.349365 175.152969,272.109131 176.915100,264.854462 C178.171310,259.682648 183.078918,255.605957 188.374130,255.146347 C192.974075,254.747086 197.457291,257.683929 199.298996,262.273163 C200.229034,264.590729 200.797363,266.992035 198.057419,268.338226 C195.201752,269.741272 193.774292,267.802582 192.856949,265.395111 C192.140503,263.514923 190.965714,262.198364 188.816956,262.343384 C186.464188,262.502258 184.799194,263.775970 183.826172,265.929413 C183.110611,267.513000 183.087189,269.207916 183.411285,270.833679 C184.714569,277.371185 189.111649,281.527069 194.480026,284.896423 C195.767181,285.704315 196.938095,285.428619 198.224045,284.762543 C206.245728,280.607788 212.114273,268.808960 210.571030,259.815674 C208.953842,250.391403 200.112366,242.321121 190.212326,241.232666 C175.676041,239.634506 166.144379,244.776901 158.962280,258.634552 z" />
            </svg>

            <span className="popup-header-label">
              {roleInfo.role === 'imposter' ? 'Secret Assignment' : 'Shared Ledger Concept'}
            </span>

            <h4>
              {roleInfo.role === 'imposter' ? 'You Are The Forger' : 'Secret Subject Word'}
            </h4>
            <span className="popup-subtitle">
              {roleInfo.role === 'imposter'
                ? 'Match the common ink strokes carefully without holding the canvas secret word.'
                : 'Contribute your single ink stroke to match this true prompt:'}
            </span>

            {roleInfo.role !== 'imposter' && (
              <div className="popup-data-box">
                <span className="main-value">{roleInfo.word}</span>
              </div>
            )}

            <button className="popup-action-btn" onClick={handleDismissRolePopup}>
              {roleInfo.role === 'imposter' ? 'Begin Deception' : 'Acknowledge Canvas'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
