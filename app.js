const TESTNET_NODE_URL = 'https://testnet.aeternity.io'
const MAINNET_NODE_URL = 'https://mainnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com'
const RECIPIENT_ADDRESS = 'ak_dvNHMgVvdSgDchLsmcUpuFTbMBGfG3E5V9KZnNjLYPyEhcqnL'

const initSimpleSdk = async () => {
  const nodes = [
      { name: 'testnet', instance: await Ae.Node({ url: TESTNET_NODE_URL })},
      // { name: 'mainnet', instance: await Ae.Node({ url: MAINNET_NODE_URL })}
  ]

  return await Ae.Universal({nodes})
}

const initRpcApp = async () => {
  const nodes = [
      // { name: 'mainnet', instance: await Ae.Node({ url: MAINNET_NODE_URL })},
      { name: 'testnet', instance: await Ae.Node({ url: TESTNET_NODE_URL })}
  ]

  const sdk = await Ae.RpcAepp({
    name: 'Example wallet æpp',
    nodes: [
      // { name: 'mainnet', instance: await Ae.Node({ url: MAINNET_NODE_URL }) },
      { name: 'testnet', instance: await Ae.Node({ url: TESTNET_NODE_URL }) }
    ],
    compilerUrl: COMPILER_URL,
    onNetworkChange: ({ networkId }) => {
      const [{ name }] = sdk.getNodesInPool()
        .filter(node => node.nodeNetworkId === networkId)
      sdk.selectNode(name)
      console.log(`Network ID changed to ${networkId}`)
    },
    onAddressChange: ({ current }) => {
      const address = Object.keys(current)[0]
      console.log(`Address changed to: ${address}`)
    },
    onDisconnect: () => console.error('Aepp is disconnected')
  })

  return sdk
}

const scanForWallets = async (sdk) => {
  const handleWallets = async function ({ wallets, newWallet }) {
    newWallet = newWallet || Object.values(wallets)[0]
    if (confirm(`Do you want to connect to wallet ${newWallet.name} with id ${newWallet.id}`)) {
      console.log('newWallet', newWallet)
      detector.stopScan()
      await sdk.connectToWallet(await newWallet.getConnection())

      const { address: { current } } = await sdk.subscribeAddress('subscribe', 'connected')
      const address = Object.keys(current)[0]
      console.log(`Wallet Address: ${address}`)
    }
  }

  const scannerConnection = await Ae.BrowserWindowMessageConnection({
    connectionInfo: { id: 'spy' },
    debug: true
  })

  const detector = await Ae.WalletDetector({ connection: scannerConnection })
  await detector.scan(handleWallets)
}

// eh, js it is IIFE
(async () => {
  // eventually run wallet in a iframe
  console.log(window === window.parent)

  // const sdk = await initSimpleSdk()
  const sdk = await initRpcApp()

  const height = await sdk.height()
  console.log("Current Block Height:" + height)

  await scanForWallets(sdk)

  document.getElementById('spend').addEventListener('click', async (e) => {
    console.log('Yahoooo')
    let returnValue = await sdk.spend(1, RECIPIENT_ADDRESS, { denomination: 'ae' })
    console.log(returnValue)
  })
})()
