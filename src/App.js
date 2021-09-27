import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React from "react";
import { ethers } from "ethers";
import myEpicNft from './utils/MyEpicNFT.json'
import loading from './loading.svg';

// Constants
const TWITTER_HANDLE = 'kng';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0xed23Fc811e3D16aEBd82f5ff6FE7D0A4f9b9f2A6";
const TOTAL_MINT_COUNT = 50;

function parseEthNetworkToStr(id) {
  const ETH_NETWORKS = {
    "1": "Mainnet",
    "42": "Kovan",
    "3": "Ropsten",
    "4": "Rinkeby",
    "5": "Goerli",
  };

  if (ETH_NETWORKS.hasOwnProperty(id)) {
    return ETH_NETWORKS[id];
  } else {
    return 'an unknown network';
  }
};

const App = () => {
  const [currentAccount, setCurrentAccount] = React.useState("");
  const [svg, setSVG] = React.useState();
  const [tokenId, setTokenId] = React.useState();
  const [isMinting, setIsMinting] = React.useState(false);
  const [ethNetwork, setEthNetwork] = React.useState();

  const OPENSEA_LINK = `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`;

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        // setEthNetwork(parseEthNetworkToStr(ethereum.networkVersion))
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        connectedContract.on("NewEpicNFTMinted", (from, tokenId, finalSVG) => {
          setSVG(finalSVG);
          setTokenId(tokenId.toNumber());
        });

        ethereum.on('chainChanged', function (accounts) {
          window.location.reload();
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const checkIfWalletIsConnected = () => {
    /*
    * First make sure we have access to window.ethereum
    */
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      setEthNetwork(parseEthNetworkToStr(ethereum.networkVersion));
    }

    ethereum.request({ method: 'eth_accounts'})
    .then(accounts => {
      if (accounts.length) {
        const account = accounts[0];
        setCurrentAccount(account);
        setEthNetwork(parseEthNetworkToStr(ethereum.networkVersion));
        setupEventListener();
      } else {
        console.log('No authorized account found.');
      }
    });
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      setEthNetwork(parseEthNetworkToStr(ethereum.networkVersion));
      setupEventListener();
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      setIsMinting(true);
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
      setIsMinting(false);
    } catch (error) {
      console.log(error);
      setIsMinting(false);
    }
  }

  React.useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
    <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
      {isMinting ? <span>Minting...</span> : <span>Mint NFT</span>}
    </button>
  );

  const renderNetworkWarning = () => (
    <p className="warning"><span className="emoji-warning">⚠️ </span>{`I see you're connected to ${ethNetwork} but this only works on Rinkeby!`}</p>
  );

  const renderConnectionStatus = () => (
    <span className="connectionStatus">
      Status: { currentAccount && ethNetwork ?
        <span className="connected">Connected</span> :
        <span className="disconnected">Not connected</span>
      }
        <span>{ currentAccount &&   ethNetwork && ethNetwork !== "Rinkeby" ? renderNetworkWarning(): null}</span>
    </span>
  );

  const svgUri = `data:image/svg+xml;utf8,${svg}`;
  console.log({svg, ethNetwork})
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <div className="header">
            <span className="gradient-text">My NFT Collection</span>
            <span>{renderConnectionStatus()}</span>
          </div>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount ? renderMintUI() : renderNotConnectedContainer()}

        </div>
        { svg && !isMinting ? (
          <div className="svgContainer">
            <img width="500px" src={svgUri} alt={`NFT #${tokenId}`} />
            <p><a href={OPENSEA_LINK}>View on OpenSea</a>
          </p></div>
          ) : isMinting ? <img className="loading" src={loading} alt="Loading spinner" />: null }
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
