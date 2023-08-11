import { ethers } from "ethers";
import { useState, useEffect } from "react";
import messageJson from "./contract/MessagePortal.json";

export default function App() {
  const [allMessages, setAllMessage] = useState([]);
  const [currAccount, setCurAccount] = useState(null);
  const [mesageContract, setMesageContract] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const APP_MSG_CONTRACT = "0x10DC5CB6e3ecAbd810780B2a5A759501dFe5610D";

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const checkNetwork = async () => {
    const { ethereum } = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);

    // Convert hexadecimal chainId to decimal
    let decimalChainId = parseInt(chainId, 16);

    if (decimalChainId !== 43113) {
      alert('You are connected to the wrong network. Please switch to the 43113 network');
      return;
    }
  };

  const switchNetwork = async () => {
    const { ethereum } = window;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa869' }], // 0x29 is the hexadecimal equivalent of 43113
      });
    } catch (switchError) {
      console.error(switchError);
    }
  };

  useEffect(() => {
    checkNetwork();
    switchNetwork();
  }, []);
  

  // const getAllMessage = async () => {
  //   const messages = await mesageContract.getAllMessages();
  //   console.log(`messages: ${messages}`);
  //   setAllMessage(messages);
  // };

  const sendMessage = async () => {
    try {
      if (msg === "") return alert("plase input");
      let tx = await mesageContract.sendMessage(msg);
      console.log("Loading...");
      setLoading(true);
      await tx.wait();
      setLoading(false);
      console.log("success!!!");
      // getAllMessage();
    } catch (error) {
      console.log(`error: ${error}`);
    }
  };

  useEffect(() => {
    const initContract = async () => {
      const { ethereum } = window;
      try {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const mContract = new ethers.Contract(
          APP_MSG_CONTRACT,
          messageJson.abi,
          signer
        );
        setMesageContract(mContract);
        const messages = await mContract.getAllMessages();
        setAllMessage(messages);

        // 添加事件监听器
        mContract.on("NewMessage", (from, timestamp, message, event) => {
          console.log("New message from " + from);
          // 这里可以根据需要处理事件
          // getAllMessage(); // 例如，当新消息到来时，重新获取所有消息
          setAllMessage((allMessages) => [...allMessages, {from: from, timestamp: timestamp, message: message}])
        });
      } catch (error) {
        console.log(error);
      }
    };
    if (currAccount !== null) {
      initContract();
    }

    // 在组件卸载时移除事件监听器
    return () => {
      if (mesageContract) {
        mesageContract.removeAllListeners("NewMessage");
      }
    };
  }, [currAccount, mesageContract]);

  return (
    <div className="flex flex-col justify-center items-center">
      <SendMessage msg={msg} setMsg={setMsg} />
      <p className="mt-4 font-bold">All messages 📩</p>
      {currAccount === null ? (
        <button
          className="px-4 py-2 mt-8 border font-medium rounded bg-red-300 text-white"
          onClick={() => connectWallet()}
        >
          Connect MateMask
        </button>
      ) : (
        <button
          className="px-4 py-2 mt-8 border font-medium rounded bg-red-500 text-white"
          onClick={() => sendMessage()}
        >
          {loading?"Loading...":"Send Message"}
        </button>
      )}
      {allMessages.length > 0 && <MessageLists allMessages={allMessages} />}
    </div>
  );
}

function MessageLists({ allMessages }) {
  return (
    <ul className="grid grid-cols-3 gap-4 max-w-lg my-8 mx-auto">
      {allMessages.map((message) => (
        <li className="p-4 border mt-2 rounded-lg w-auto" key={message.datetime}>
          <div className="text-left">
            <p>
              <span className="font-bold">
                `{message.from.slice(0, 2)}...{message.from.slice(-4)}`
              </span>
              said:
            </p>
            <blockquote className="italic">{message.text}</blockquote>
          </div>
          <p className="text-sm mt-4 text-right">
            posted on {message.datetime}
          </p>
          <p></p>
        </li>
      ))}
    </ul>
  );
}

function SendMessage({ msg, setMsg }) {
  return (
    <div className="flex flex-col max-w-md mx-auto space-y-4 mt-8">
      <textarea
        placeholder="input some info"
        value={msg}
        cols="30"
        rows="5"
        className="border ring-none text-pink-600 font-medium rounded p-2"
        onChange={(v) => setMsg(v.target.value)}
      ></textarea>
    </div>
  );
}
