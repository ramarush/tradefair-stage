/**
 * Trading Platform API Integration Service
 *
 * This service handles all interactions with the trading platform APIs
 * including admin authentication and user management operations.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface TradingPlatformLoginResponse {
  data: {
    id: number;
    firstName: string;
    userTypeId: number;
    parentId: number;
    forceChangePW: boolean;
    demo: boolean;
    termsAccepted: boolean;
    userName: string;
    gmtOffset: string;
    serverGmtOffset: string;
    token: string;
    clientCurrencyPolicyIdNodes: number[];
    clientGenericPolicyIdNodes: number[];
    dealerCurrencyPolicyIdNodes: number[];
    roboDealerPolicyIdNodes: number[];
    accountMirroringPolicyIdNodes: number[];
    agentCommissionPolicyIdNodes: number[];
    isMultiSession: boolean;
    canTransferMoney: boolean;
    amountScaleValue: number;
    redisKey: string;
    creditLoanPercentage: number;
    enableCashDelivery: boolean;
    userCurrencyId: number;
    canTransferPosition: boolean;
    twoFactorAuthenticationEnabled: boolean;
    dealerTreeUserIdNode: number[];
    clientTreeUserIdNode: number[];
    enableDepositRequest: boolean;
  };
  dto: null;
  message: string;
  httpStatus: number;
  timestamp: number;
  success: boolean;
}

interface TradingPlatformUserCreateRequest {
  accountID: number;
  accountMirroringAccountIds: number[];
  accountMirroringPolicyId: number;
  address: string;
  currencySign: string;
  accountIdPrefix: string;
  clientPriceExecution: boolean;
  canTransferMoney: boolean;
  canTransferPosition: boolean;
  country: string;
  currenciesPolicyID: number;
  firstName: string;
  forceChangePassword: boolean;
  genericPolicyID: number;
  ignoreLiquidation: boolean;
  isAllowMultiSession: boolean;
  isDemo: boolean;
  isLocked: boolean;
  lastName: string;
  mobile: string;
  parentId: number;
  password: string;
  secondPassword: string;
  investorPassword: string;
  percentageLevel1: number;
  percentageLevel2: number;
  percentageLevel3: number;
  percentageLevel4: number;
  creditLoanPercentage: number;
  roboDealerPolicyId: number;
  telephonePass: string;
  tradingType: number;
  userCurrencyId: number;
  userType: number;
  username: any;
  validateMoneyBeforeClose: boolean;
  validateMoneyBeforeEntry: boolean;
  closeOnly: boolean;
  openOnly: boolean;
  noSellAtLoss: boolean;
  enableCashDelivery: boolean;
  enableDepositRequest: boolean;
  canCreateOrUpdateEntryOrder: boolean;
  sendCredentialsEmailToUser: boolean;
  isVerified: boolean;
  ignoreBlockTradeIfInLoss: boolean;
  userWhiteListIps: string[];
  enableApi: boolean;
  chargeMarginForEntry: boolean;
}

interface TradingPlatformUserCreateResponse {
  data: {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    accountId: number;
    allowMultiSession: boolean;
    whiteLabel: boolean;
    parentId: number;
  };
  dto: null;
  message: string;
  httpStatus: number;
  timestamp: number;
  success: boolean;
}

interface TradingPlatformDepositRequest {
  amount: number;
  bankId: number;
  comment: string;
  userId: number;
}

interface TradingPlatformDepositResponse {
  data: unknown[];
  dto: {
    requestId: number;
    comment: string;
    userId: number;
    amount: number;
    requestDate: string;
    requestIsDeleted: boolean;
    status: number;
    bankId: number;
    firstTime: boolean;
    credibility: number;
  };
  message: string;
  httpStatus: number;
  timestamp: number;
  success: boolean;
}

interface TradingPlatformCashRequest {
  amount: number;
  branchId: number;
  comment: string;
  userId: number;
  secondPassword: string;
}

interface TradingPlatformCashResponse {
  data: null;
  dto: {
    requestID: number;
    userID: number;
    requestAmount: number;
    requestComment: string;
    requestDate: string;
    requestIsDeleted: boolean;
    status: number;
    branchId: number;
    firstTime: boolean;
    credibility: number;
  };
  message: string;
  httpStatus: number;
  timestamp: number;
  success: boolean;
}

interface TradingPlatformCashDeliveryRequest {
  branchId: number;
  comment: string;
  requestId: number;
  status: number;
}

interface TradingPlatformCashDeliveryResponse {
  data: any;
  dto: any;
  message: string;
  httpStatus: number;
  timestamp: number;
  success: boolean;
}

interface TradingPlatformMoneyTransferRequest {
  receiverAccountId: number;
  secondPassword: string;
  senderUserId: number;
  transferType: number;
  trxAmount: number;
}

interface TradingPlatformMoneyTransferResponse {
  data: any;
  dto: any;
  message: string;
  httpStatus: number;
  timestamp: number;
  success: boolean;
}

interface TradingPlatformUserFinancialsResponse {
  data: {
    accountId: number;
    userId: number;
    liquidationType: number;
    liquidationPoint: number;
    ignoreLiquidation: boolean;
    autoLiquidation: boolean;
    balance: number;
    currentPL: number;
    credit: number;
    bonus: number;
    equity: number;
    usedMargin: number;
    freeMargin: number;
    marginLevel: number;
    clientCurrencyPolicyId: number;
    clientGenericPolicyId: number;
    totalOpenCommission: number;
    totalCloseCommission: number;
    totalCloseProfit: number;
    holdingMargin: number;
    totalWithdrawals: number;
    totalDeposits: number;
  };
  dto: null;
  message: string;
  httpStatus: number;
  timestamp: number;
  success: boolean;
}

class TradingPlatformApiService {
  private baseUrl: string;
  private companyName: string;
  private username: string;
  private password: string;
  private adminToken: string | null = null;
  private tokenExpiryTime: number = 0;
  private isRefreshingToken: boolean = false; // Flag to prevent concurrent refresh attempts

  constructor() {
    this.baseUrl = process.env.TRADING_PLATFORM_BASE_URL || "";
    this.companyName = process.env.TRADING_PLATFORM_COMPANY_NAME || "";
    this.username = process.env.TRADING_PLATFORM_USERNAME || "";
    this.password = process.env.TRADING_PLATFORM_PASSWORD || "";

    if (
      !this.baseUrl ||
      !this.companyName ||
      !this.username ||
      !this.password
    ) {
      throw new Error(
        "Trading platform environment variables are not properly configured"
      );
    }
  }

  /**
   * Load token from token.json file
   */


  /**
   * Save token to token.json file
   */
  private async saveTokenToFile(
    token: string,
    expiryTime: number
  ): Promise<void> {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");

      const tokenFilePath = path.join(process.cwd(), "token.json");
      const tokenData = {
        token,
        expiryTime,
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(tokenFilePath, JSON.stringify(tokenData, null, 2));
      
    } catch (error) {
      console.error("Error saving token to file:", error);
      // Don't throw error - token persistence is not critical
    }
  }

  /**
   * Login as admin to get authentication token
   */
  private async loginAsAdmin(): Promise<string> {
    try {
   

      const response = await fetch(
        `${this.baseUrl}/login/public/api/v1/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: this.companyName,
            password: this.password,
            userName: this.username,
          }),
        }
      );

  
      if (!response.ok) {
        throw new Error(
          `Trading platform login failed: ${response.status} ${response.statusText}`
        );
      }

      const data: TradingPlatformLoginResponse = await response.json();

      if (!data.success) {
        throw new Error(`Trading platform login failed: ${data.message}`);
      }

      this.adminToken = data.data.token;
      // Set token expiry time (assuming 24 hours validity, adjust as needed)
      this.tokenExpiryTime = Date.now() + 24 * 60 * 60 * 1000;

      // Save token to file for future use
      await this.saveTokenToFile(this.adminToken, this.tokenExpiryTime);


      return this.adminToken;
    } catch (error) {
      console.error("Error logging into trading platform:", error);
      throw error;
    }
  }

  /**
   * Get valid admin token (login if needed or token expired)
   */
  private async getValidAdminToken(): Promise<string> {
    if (!this.adminToken || Date.now() >= this.tokenExpiryTime) {

      await this.loginAsAdmin();
    }



    return this.adminToken!;
  }

  /**
   * Refresh token if session expired (HTTP 40)
   */
  private async refreshTokenIfNeeded(response: Response): Promise<boolean> {
    if (response.status === 401) {
      // Session expired
      if (this.isRefreshingToken) {
        // Another refresh is in progress, wait a bit and return
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      }

      this.isRefreshingToken = true;
      try {
     
        await this.loginAsAdmin();
        return true;
      } finally {
        this.isRefreshingToken = false;
      }
    }
    return false;
  }

  /**
   * Get currency ID based on currency code
   */
  private getCurrencyId(currency: string): number {
    switch (currency.toUpperCase()) {
      case "INR":
        return 631;
      case "USD":
        return 1;
      default:
        return 1; // Default to USD
    }
  }

  /**
   * Get system settings to retrieve ARK variables
   */
  private async getSystemSettings(): Promise<any> {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const settings = await prisma.systemSettings.findFirst({
        orderBy: { createdAt: "desc" },
      });

      await prisma.$disconnect();
      return settings?.settings || {};
    } catch (error) {
      console.error("Error fetching system settings:", error);
      return {};
    }
  }

  /**
   * Create a new user on the trading platform
   */
  async createUser(userData: {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    currency: string;
    mobile: string;
    email: string;
    password: string;
    country: string;
  }): Promise<{
    success: boolean;
    tradingPlatformUserId?: number;
    tradingPlatformAccountId?: number;
    message?: string;
    error?: string;
  }> {

    console.log(" create user on trading platform", userData)
    try {
      const token = await this.getValidAdminToken();

      const systemSettings = await this.getSystemSettings();
      const arkVariables = systemSettings.arkVariables || {};

     

      // Get the last trading_platform_account_id for this currency and increment by 1
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      let accountID = -1;

      try {
        const lastUser = await prisma.user.findFirst({
          where: {
            currency: userData.currency,
            tradingPlatformAccountId: {
              not: null,
            },
          },
          orderBy: {
            tradingPlatformAccountId: "desc"
          },
          select: {
            tradingPlatformAccountId: true,
          },
        });

  console.log(' lastUser', )
        if (lastUser && lastUser.tradingPlatformAccountId) {

 
          accountID = lastUser.tradingPlatformAccountId + 1;
        } else {
       
          // If no previous users found for this currency, use series base as starting point
          if (userData.currency === "USD" && arkVariables.usdSeries) {
         

            accountID = parseInt(arkVariables.usdSeries) || 1;
          } else if (userData.currency === "INR" && arkVariables.inrSeries) {
            
            accountID = parseInt(arkVariables.inrSeries)  +1 || 1;
          } else {
           
            accountID = 1; // Ultimate fallback
          }
        }


        await prisma.$disconnect();
      } catch (error) {



        console.log(
          "Error fetching last trading platform account ID:",
          error
        );
        await prisma.$disconnect();
console.log(" prisma disconnect tradingAPI create user time ")
        // Fallback to old logic if database query fails
        if (userData.currency === "USD" && arkVariables.usdSeries) {
          const seriesBase = parseInt(arkVariables.usdSeries) || 0;
          accountID = userData.userId + seriesBase;
        } else if (userData.currency === "INR" && arkVariables.inrSeries) {
          const seriesBase = parseInt(arkVariables.inrSeries) || 0;
         
          accountID = userData.userId + seriesBase;
        } else {
          accountID = -1;
        }
      }
     

      // Validate accountID before proceeding
      if (accountID < 1) {
        return {
          success: false,
          error: "Invalid accountID calculated. Unable to create user.",
        };
      }



      const createUserPayload: TradingPlatformUserCreateRequest = {
        accountID: accountID,
        accountMirroringAccountIds: [],
        accountMirroringPolicyId: -1,
        address: "",
        currencySign: "",
        accountIdPrefix: "",
        clientPriceExecution: false,
        canTransferMoney: false,
        canTransferPosition: false,
        country: userData.country,
        currenciesPolicyID: userData.currency === "INR" ? 71 : 72,
        firstName: userData.firstName,
        forceChangePassword: false,
        genericPolicyID: 41,
        ignoreLiquidation: false,
        isAllowMultiSession: true,
        isDemo: false,
        isLocked: false,
        lastName: userData.lastName,
        mobile: userData.mobile,
        parentId: 372,
        password: userData.password,
        secondPassword: "",
        investorPassword: "",
        percentageLevel1: 100.0,
        percentageLevel2: 100.0,
        percentageLevel3: 100.0,
        percentageLevel4: 100.0,
        creditLoanPercentage: 0.0,
        roboDealerPolicyId: -1,
        telephonePass: "",
        tradingType: 1,
        userCurrencyId: 1,
        userType: 1,
        username: accountID,
        validateMoneyBeforeClose: false,
        validateMoneyBeforeEntry: true,
        closeOnly: false,
        openOnly: false,
        noSellAtLoss: false,
        enableCashDelivery: true,
        enableDepositRequest: true,
        canCreateOrUpdateEntryOrder: true,
        sendCredentialsEmailToUser: true,
        isVerified: true,
        ignoreBlockTradeIfInLoss: false,
        userWhiteListIps: [],
        enableApi: false,
        chargeMarginForEntry: false,
      };

    
console.log(" call ark create user api ")
      await this.loginAsAdmin();
      const response = await fetch(`${this.baseUrl}/admin/public/api/v1/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createUserPayload),
      });

      

      
      if (!response.ok) {
        console.log(" response is not ok" ,response.ok)
        const errorText = await response.text();
        console.error(
          "Trading platform user creation failed:",
          response.status,
          errorText
        );

        // Check if session expired and retry once
        if (response.status === 401) {
         console.log(" response status 401")
          const newToken = await this.getValidAdminToken();
         
          const retryResponse = await fetch(
            `${this.baseUrl}/admin/public/api/v1/user`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(createUserPayload),
            }
          );

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            return {
              success: false,
              error: `Trading platform user creation failed after retry: ${retryResponse.status} ${retryErrorText}`,
            };
          }

          const retryData: TradingPlatformUserCreateResponse =
            await retryResponse.json();
          if (!retryData.success) {
            return {
              success: false,
              error: `Trading platform user creation failed after retry: ${retryData.message}`,
            };
          }

        
          return {
            success: true,
            tradingPlatformUserId: retryData.data.userId,
            tradingPlatformAccountId: retryData.data.accountId,
            message: "User created successfully on trading platform",
          };
        }

        return {
          success: false,
          error: `Trading platform user creation failed: ${response.status} ${errorText}`,
        };
      }

      const data: TradingPlatformUserCreateResponse = await response.json();
console.log(" TradingPlatformUserCreateResponse data",)

      if (!data.success) {
        console.error("Trading platform user creation failed:", data.message);
        return {
          success: false,
          error: `Trading platform user creation failed: ${data.message}`,
        };
      }

     

      console.log(" final respomse TradingPlatformUserCreateResponse" ,data)

      return {
        success: true,
        tradingPlatformUserId: data.data.userId,
        tradingPlatformAccountId: data.data.accountId,
        message: "User created successfully on trading platform",
      };
    } catch (error) {
      console.error("Error creating user on trading platform:", error);
      return {
        success: false,
        error: `Error creating user on trading platform: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }


  /**
   * Delete a user on the trading platform
   */
  async deleteUser(tradingPlatformUserId: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const token = await this.getValidAdminToken();

      const response = await fetch(
        `${this.baseUrl}/admin/public/api/v1/user/${tradingPlatformUserId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Trading platform user deletion failed:",
          response.status,
          errorText
        );

        // Check if session expired and retry once
        if (response.status === 401) {
          const newToken = await this.getValidAdminToken();
          const retryResponse = await fetch(
            `${this.baseUrl}/admin/public/api/v1/user/${tradingPlatformUserId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            }
          );

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            return {
              success: false,
              error: `Trading platform user deletion failed after retry: ${retryResponse.status} ${retryErrorText}`,
            };
          }

          return {
            success: true,
            message: "User deleted successfully on trading platform after retry",
          };
        }

        return {
          success: false,
          error: `Trading platform user deletion failed: ${response.status} ${errorText}`,
        };
      }

      return {
        success: true,
        message: "User deleted successfully on trading platform",
      };
    } catch (error) {
      console.error("Error deleting user on trading platform:", error);
      return {
        success: false,
        error: `Error deleting user on trading platform: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Get current balance for a list of user IDs from trading platform
   */
  async getCurrentBalance(
    userIds: number
  ): Promise<{
    success: boolean;
    balances?: Record<number, number>;
    message: string;
    data?: any;
  }> {
    try {
      let token = await this.getValidAdminToken();


      const query = userIds.toString();
      const url = `${this.baseUrl}/financialStandings/public/api/v1/userFinancials?userIds=${encodeURIComponent(
        query
      )}&withDemo=false`;

      let response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if(response.status === 401) {
   
        // Re-login to get a fresh token
        await this.loginAsAdmin();
        token = this.adminToken!;
        
        // Retry the request with the new token
        response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Trading platform getCurrentBalance failed:",
          response.status,
          errorText
        );
        return {
          success: false,
          message: `Trading platform getCurrentBalance failed: ${response.status} ${errorText}`,
        };
      }

      const data = await response.json();

      if (!data.success) {
        console.error("Trading platform getCurrentBalance failed:", data.message);
        return {
          success: false,
          message: `Trading platform getCurrentBalance failed: ${data.message}`,
        };
      }

      // Map userId -> balance
      const balances: Record<number, number> = {};
      if (Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          if (item.userId !== undefined && item.balance !== undefined) {
            balances[item.userId] = item.balance;
          }
        });
      }

  
      return {
        success: true,
        balances,
        message: "Current balances retrieved successfully",
        data: data.data,
      };
    } catch (error) {
      console.error("Error getting current balance:", error);
      return {
        success: false,
        message: `Failed to get current balance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Create a deposit request on the trading platform
  /**
   * Create a deposit request on the trading platform
  /**
   * Create a deposit request on the trading platform
   */
  async createDepositRequest(depositData: {
    amount: number;
    bankId: number;
    comment: string;
    tradingPlatformUserId: number;
  }): Promise<{
    success: boolean;
    requestId?: number;
    message: string;
    response?: any;
  }> {
    try {
      // Force a fresh login before every deposit request to avoid stale tokens
      
      await this.loginAsAdmin();
      const token = this.adminToken!;



      const depositRequestPayload: TradingPlatformDepositRequest = {
        amount: depositData.amount,
        bankId: depositData.bankId,
        comment: depositData.comment,
        userId: depositData.tradingPlatformUserId,
      };

     console.log("++++++++++++++++++++ createDepositReq on trading platform " )

      const response = await fetch(
        `${this.baseUrl}/admin/public/api/v1/depositRequest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(depositRequestPayload),
        }
      );

      console.log("++++++++++++++++++++ createDepositReq on trading platform response ",response.ok)
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Trading platform deposit request failed:",
          response.status,
          errorText
        );
        return {
          success: false,
          message: `Trading platform deposit request failed: ${response.status} ${errorText}`,
        };
      }

      const data: TradingPlatformDepositResponse = await response.json();

      if (!data.success) {
        console.error("Trading platform deposit request failed:", data.message);
        return {
          success: false,
          message: `Trading platform deposit request failed: ${data.message}`,
        };
      }
      
      console.log("++++++++++++++++++ trading platform data" ,data)
      
      return {
        success: true,
        requestId: data.dto.requestId,
        message: "Deposit request created successfully on trading platform",
        response: data.dto,
      };
    } catch (error) {
      console.error("Error creating deposit request:", error);
      return {
        success: false,
        message: "Failed to create deposit request on trading platform",
      };
    }
  }

  /**
   * Handle deposit request (approve or reject) on trading platform
   */
  async handleDepositRequest(
    requestId: string,
    status: "approve" | "reject",
    comment?: string
  ): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
    message?: string;
  }> {
    try {
      const token = await this.getValidAdminToken();

      // Get system settings to get bankId
      const systemSettings = await this.getSystemSettings();
      const arkVariables = systemSettings.arkVariables || {};
      const bankId = parseInt(arkVariables.bankId) || 34; // Default fallback

      const statusCode = status === "approve" ? 2 : 3; // 2 = approve, 3 = reject

      const payload = {
        bankId: bankId,
        comment: comment || "",
        requestId: requestId,
        status: statusCode,
      };


      const response = await fetch(
        `${this.baseUrl}/admin/public/api/v1/depositRequest/handle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Trading platform deposit handle error:",
          response.status,
          errorText
        );

        // Check if session expired and retry once
        if (response.status === 401) {
          
          const newToken = await this.getValidAdminToken();
          const retryResponse = await fetch(
            `${this.baseUrl}/admin/public/api/v1/depositRequest/handle`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(payload),
            }
          );

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            return {
              success: false,
              message: `Trading platform error after retry: ${retryResponse.status} - ${retryErrorText}`,
            };
          }

          const retryResult = await retryResponse.json();
         
          return {
            success: true,
            message: `Deposit ${
              status === "approve" ? "approved" : "rejected"
            } successfully on trading platform after retry`,
          };
        }

        return {
          success: false,
          message: `Trading platform error: ${response.status} - ${errorText}`,
        };
      }

      const result = await response.json();
     

      return {
        success: true,
        message: `Deposit ${
          status === "approve" ? "approved" : "rejected"
        } successfully on trading platform`,
      };
    } catch (error) {
      console.error("Error handling deposit request:", error);
      return {
        success: false,
        message: "Failed to handle deposit request on trading platform",
      };
    }
  }

  /**
   * Create a cash request (withdrawal) on the trading platform
   */
  async createCashRequest(cashData: {
    amount: number;
    comment: string;
    tradingPlatformUserId: number;
  }): Promise<{
    success: boolean;
    requestId?: number;
    message: string;
    response?: any;
  }> {

   
    try {
      const token = await this.getValidAdminToken();

      // Get system settings to get branchId and secondPassword
      const systemSettings = await this.getSystemSettings();
      const arkVariables = systemSettings.arkVariables || {};
      const branchId = parseInt(arkVariables.branchId) || 1; // Default fallback
      const secondPassword = arkVariables.secondPassword || "Second@123"; // Default fallback

      const cashRequestPayload: TradingPlatformCashRequest = {
        amount: cashData.amount,
        branchId: branchId,
        comment: cashData.comment,
        userId: cashData.tradingPlatformUserId,
        secondPassword: secondPassword,
      };
console.log("+++++++++++++++++++++++ call tradingPlatform api type withdrawal request", cashRequestPayload)
      const response = await fetch(
        `${this.baseUrl}/trading/public/api/v1/cashRequest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cashRequestPayload),
        }
      );


      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Trading platform cash request failed:",
          response.status,
          errorText
        );

        // Check if session expired and retry once
        if (response.status === 401) {
     console.log("+++++++++++++++++++++++ expire token recall login api ")
          const newToken = await this.getValidAdminToken();
          const retryResponse = await fetch(
            `${this.baseUrl}/trading/public/api/v1/cashRequest`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(cashRequestPayload),
            }
          );

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            return {
              success: false,
              message: `Trading platform cash request failed after retry: ${retryResponse.status} ${retryErrorText}`,
            };
          }

          const retryData: TradingPlatformCashResponse =
            await retryResponse.json();
          if (!retryData.success) {
            console.log("++++++++++++++++++++++++++++++++ trading platform cash request api failed", retryData.message)
            return {
              success: false,
              message: `Trading platform cash request failed after retry: ${retryData.message}`,
            };
          }

          
          return {
            success: true,
            requestId: retryData.dto.requestID,
            message: "Cash request created successfully on trading platform",
            response: retryData.dto,
          };
        }

        return {
          success: false,
          message: `Trading platform cash request failed: ${response.status} ${response.statusText}`,
        };
      }

      const data: TradingPlatformCashResponse = await response.json();

console.log("+++++++++++++++++++++++ trading platform cash request api success", data)

      if (!data.success) {
        console.error("Trading platform cash request failed:", data.message);
        return {
          success: false,
          message: `Trading platform cash request failed: ${data.message}`,
        };
      }

    

      return {
        success: true,
        requestId: data.dto.requestID,
        message: "Cash request created successfully on trading platform",
        response: data.dto,
      };
    } catch (error) {
      console.error("Error creating cash request:", error);
      return {
        success: false,
        message: "Failed to create cash request on trading platform",
      };
    }
  }

  /**
   * Handle cash delivery (approve or reject withdrawal) on trading platform
   */
  async handleCashDelivery(
    requestId: number,
    action: "approve" | "reject",
    comment?: string
  ): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
    message?: string;
  }> {
    try {
      const token = await this.getValidAdminToken();

      // Get system settings to get branchId
      const systemSettings = await this.getSystemSettings();
      const arkVariables = systemSettings.arkVariables || {};
      const branchId = parseInt(arkVariables.branchId) || 1; // Default fallback

      const statusCode = action === "approve" ? 2 : 3; // 2 = approve, 3 = reject

      const payload: TradingPlatformCashDeliveryRequest = {
        branchId: branchId,
        comment: comment || "",
        requestId: requestId,
        status: statusCode,
      };

   

      // Use different endpoints for approve vs reject
      const endpoint =
        action === "approve"
          ? `${this.baseUrl}/admin/public/api/v1/cashDelivery/accept`
          : `${this.baseUrl}/admin/public/api/v1/cashDelivery`;

      const method = action === "approve" ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Trading platform cash delivery error:",
          response.status,
          errorText
        );

        // Check if session expired and retry once
        if (response.status === 401) {
          
          const newToken = await this.getValidAdminToken();
          const retryResponse = await fetch(endpoint, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            return {
              success: false,
              message: `Trading platform error after retry: ${retryResponse.status} - ${retryErrorText}`,
            };
          }

          const retryResult: TradingPlatformCashDeliveryResponse =
            await retryResponse.json();
         
          return {
            success: true,
            message: `Withdrawal ${
              action === "approve" ? "approved" : "rejected"
            } successfully on trading platform after retry`,
            data: retryResult,
          };
        }

        return {
          success: false,
          message: `Trading platform error: ${response.status} - ${errorText}`,
        };
      }

      const result: TradingPlatformCashDeliveryResponse = await response.json();
      

      return {
        success: true,
        message: `Withdrawal ${
          action === "approve" ? "approved" : "rejected"
        } successfully on trading platform`,
        data: result,
      };
    } catch (error) {
      console.error("Error handling cash delivery:", error);
      return {
        success: false,
        message: "Failed to handle cash delivery on trading platform",
      };
    }
  }

  /**
   * Transfer money between accounts (main account to user account or vice versa)
   */
  async transferMoney(transferData: {
    receiverAccountId: number;
    senderUserId: number;
    amount: number;
    currency: string;
    isWithdrawal?: boolean; // Flag to indicate if this is a withdrawal (user to main account)
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const token = await this.getValidAdminToken();

      // Get system settings to get secondPassword and main account IDs
      const systemSettings = await this.getSystemSettings();
      const arkVariables = systemSettings.arkVariables || {};
      const secondPassword = arkVariables.secondPassword || "Second@123"; // Default fallback

      // Determine sender and receiver based on whether this is a withdrawal or deposit
      let senderUserId: number;
      let receiverAccountId: number;

      if (transferData.isWithdrawal) {
        // For withdrawals: transfer FROM user account TO main account
        senderUserId = transferData.senderUserId; // User's trading platform user ID

        // Receiver is the main account based on currency
        if (transferData.currency === "USD" && arkVariables.usdMainAccount) {
          receiverAccountId = parseInt(arkVariables.usdMainAccount);
        } else if (
          transferData.currency === "INR" &&
          arkVariables.inrMainAccount
        ) {
          receiverAccountId = parseInt(arkVariables.inrMainAccount);
        } else {
          receiverAccountId = transferData.receiverAccountId; // Fallback
        }
      } else {
        // For deposits: transfer FROM main account TO user account
        receiverAccountId = transferData.receiverAccountId; // User's account ID

        // Sender is the main account user ID based on currency
        if (
          transferData.currency === "USD" &&
          arkVariables.usdMainAccountUserId
        ) {
          senderUserId = parseInt(arkVariables.usdMainAccountUserId);
        } else if (
          transferData.currency === "INR" &&
          arkVariables.inrMainAccountUserId
        ) {
          senderUserId = parseInt(arkVariables.inrMainAccountUserId);
        } else {
          senderUserId = transferData.senderUserId; // Fallback
        }
      }

      const transferPayload: TradingPlatformMoneyTransferRequest = {
        receiverAccountId: receiverAccountId,
        secondPassword: secondPassword,
        senderUserId: senderUserId,
        transferType: 1, // Transfer type 1 as per API documentation
        trxAmount: transferData.amount,
      };


      const response = await fetch(
        `${this.baseUrl}/admin/public/api/v1/money/transaction`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transferPayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Trading platform money transfer failed:",
          response.status,
          errorText
        );

        // Check if session expired and retry once
        if (response.status === 401) {
      
          const newToken = await this.getValidAdminToken();
          const retryResponse = await fetch(
            `${this.baseUrl}/admin/public/api/v1/money/transaction`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(transferPayload),
            }
          );

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            return {
              success: false,
              message: `Trading platform money transfer failed after retry: ${retryResponse.status} ${retryErrorText}`,
            };
          }

          const retryData: TradingPlatformMoneyTransferResponse =
            await retryResponse.json();
          if (!retryData.success) {
            return {
              success: false,
              message: `Trading platform money transfer failed after retry: ${retryData.message}`,
            };
          }

          const transferDirection = transferData.isWithdrawal
            ? "from user to main account"
            : "from main account to user";
         
          return {
            success: true,
            message: `Money transfer completed successfully on trading platform after retry (${transferDirection})`,
            data: retryData.data,
          };
        }

        return {
          success: false,
          message: `Trading platform money transfer failed: ${response.status} ${response.statusText}`,
        };
      }

      const data: TradingPlatformMoneyTransferResponse = await response.json();

      if (!data.success) {
        console.error("Trading platform money transfer failed:", data.message);
        return {
          success: false,
          message: `Trading platform money transfer failed: ${data.message}`,
        };
      }

      const transferDirection = transferData.isWithdrawal
        ? "from user to main account"
        : "from main account to user";
    

      return {
        success: true,
        message: `Money transfer completed successfully on trading platform (${transferDirection})`,
        data: data.data,
      };
    } catch (error) {
      console.error("Error transferring money:", error);
      return {
        success: false,
        message: `Failed to transfer money on trading platform: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Get user financial information including balance from trading platform
   */
  async getUserFinancials(
    tradingPlatformUserId: number
  ): Promise<{
    success: boolean;
    balance?: number;
    data?: any;
    message: string;
  }> {
    try {
      const token = await this.getValidAdminToken();


   await this.loginAsAdmin();
      const response = await fetch(
        `${this.baseUrl}/trading/public/api/v1/userFinancials/${tradingPlatformUserId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

   

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Trading platform user financials request failed:",
          response.status,
          errorText
        );

        // Check if session expired and retry once
        if (response.status === 401) {
        
          const newToken = await this.getValidAdminToken();
          const retryResponse = await fetch(
            `${this.baseUrl}/trading/public/api/v1/userFinancials/${tradingPlatformUserId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            }
          );

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            return {
              success: false,
              message: `Trading platform user financials request failed after retry: ${retryResponse.status} ${retryErrorText}`,
            };
          }

          const retryData: TradingPlatformUserFinancialsResponse =
            await retryResponse.json();
          if (!retryData.success) {
            return {
              success: false,
              message: `Trading platform user financials failed after retry: ${retryData.message}`,
            };
          }


  
         
          return {
            success: true,
            balance: retryData.data.balance,
            data: retryData.data,
            message:
              "User financials fetched successfully from trading platform",
          };
        }

        return {
          success: false,
          message: `Trading platform user financials request failed: ${response.status} ${response.statusText}`,
        };
      }

      const data: TradingPlatformUserFinancialsResponse = await response.json();

      if (!data.success) {
        console.error("Trading platform user financials failed:", data.message);
        return {
          success: false,
          message: `Trading platform user financials failed: ${data.message}`,
        };
      }

     

      return {
        success: true,
        balance: data.data.balance,
        data: data.data,
        message: "User financials fetched successfully from trading platform",
      };
    } catch (error) {
      console.error("Error fetching user financials:", error);
      return {
        success: false,
        message: `Failed to fetch user financials from trading platform: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Test the connection to trading platform
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getValidAdminToken();
      return {
        success: true,
        message: "Successfully connected to trading platform",
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to trading platform: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}

// Export singleton instance
export const tradingPlatformApi = new TradingPlatformApiService();
export default tradingPlatformApi;
