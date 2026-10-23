export const POOL_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function reserve0() external view returns (uint256)",
  "function reserve1() external view returns (uint256)",
  "function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1)",
  "function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut)",
  "function quoteAddLiquidity(uint256 amount0Desired, uint256 amount1Desired) external view returns (uint256 amount0, uint256 amount1, uint256 shares)",
  "function addLiquidity(uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address to, uint256 deadline) external returns (uint256 amount0, uint256 amount1, uint256 shares)",
  "function removeLiquidity(uint256 shares, uint256 amount0Min, uint256 amount1Min, address to, uint256 deadline) external returns (uint256 amount0, uint256 amount1)",
  "function swap(address tokenIn, uint256 amountIn, uint256 amountOutMin, address to, uint256 deadline) external returns (uint256 amountOut)",
  "function sync() external",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "event Mint(address indexed sender, address indexed to, uint256 amount0, uint256 amount1, uint256 shares)",
  "event Burn(address indexed sender, address indexed to, uint256 amount0, uint256 amount1, uint256 shares)",
  "event Swap(address indexed sender, address indexed recipient, address indexed tokenIn, uint256 amountIn, uint256 amountOut)",
  "event Sync(uint256 reserve0, uint256 reserve1)"
];

export const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function transfer(address to, uint256 value) external returns (bool)",
  "function transferFrom(address from, address to, uint256 value) external returns (bool)",
  "function mint(address to, uint256 amount) external",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];
