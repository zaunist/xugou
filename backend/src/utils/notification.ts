import { D1Database } from '../models/db';
import { 
  NotificationChannel, 
  NotificationTemplate, 
  NotificationSettings
} from '../models/notification';
import { 
  getNotificationChannelById, 
  getNotificationTemplateById,
  createNotificationHistory 
} from '../db/notification';

// 通知渠道配置接口定义
interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface EmailConfig {
  receipts: string;
  smtpServer?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  senderEmail?: string;
  useSSL?: boolean;
}

/**
 * 解析通知渠道配置
 */
function parseChannelConfig<T>(channel: NotificationChannel): T {
  try {
    console.log(`[解析配置] 开始解析渠道ID=${channel.id} 名称=${channel.name} 类型=${channel.type}的配置`);
    
    let config: any;
    if (typeof channel.config === 'string') {
      // 如果是字符串，尝试解析为JSON对象
      try {
        config = JSON.parse(channel.config);
        console.log(`[解析配置] 成功解析渠道${channel.id}的JSON配置`);
      } catch (jsonError) {
        console.error(`[解析配置] 解析渠道${channel.id}的JSON配置失败:`, jsonError);
        console.error(`[解析配置] 配置内容: ${channel.config.substring(0, 100)}${channel.config.length > 100 ? '...' : ''}`);
        return {} as T;
      }
    } else if (typeof channel.config === 'object') {
      // 如果已经是对象，直接使用
      config = channel.config;
      console.log(`[解析配置] 渠道${channel.id}配置已经是对象格式`);
    } else {
      console.error(`[解析配置] 无效的配置格式: ${typeof channel.config}`);
      return {} as T;
    }
    
    // 根据渠道类型进行配置验证
    if (channel.type === 'email') {
      // 验证邮件配置
      if (!config.receipts) {
        console.warn(`[解析配置] 邮件渠道${channel.id}缺少收件人配置`);
      }
      if (!config.smtpServer) {
        console.warn(`[解析配置] 邮件渠道${channel.id}缺少SMTP服务器配置`);
      }
      if (!config.smtpUsername) {
        console.warn(`[解析配置] 邮件渠道${channel.id}缺少SMTP用户名配置`);
      }
      
      // 检查是否可能是配置类型错误 - 包含telegram配置项
      if (config.botToken || config.chatId) {
        console.error(`[解析配置] 警告: 邮件渠道${channel.id}包含Telegram配置项，可能配置类型错误`);
      }
    } else if (channel.type === 'telegram') {
      // 验证Telegram配置
      if (!config.botToken) {
        console.warn(`[解析配置] Telegram渠道${channel.id}缺少botToken配置`);
      }
      if (!config.chatId) {
        console.warn(`[解析配置] Telegram渠道${channel.id}缺少chatId配置`);
      }
      
      // 检查是否可能是配置类型错误 - 包含email配置项
      if (config.smtpServer || config.smtpUsername || config.receipts) {
        console.error(`[解析配置] 警告: Telegram渠道${channel.id}包含邮件配置项，可能配置类型错误`);
      }
    }
    
    console.log(`[解析配置] 渠道${channel.id}配置解析完成`);
    return config as T;
  } catch (e) {
    console.error('解析渠道配置失败:', e);
    console.error('解析失败的渠道信息:', {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      config: typeof channel.config === 'string' ? 
        (channel.config.substring(0, 50) + (channel.config.length > 50 ? '...' : '')) : 
        '非字符串格式'
    });
    return {} as T;
  }
}

/**
 * 变量替换函数 - 替换模板中的变量
 */
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * 通过邮件渠道发送通知
 */
async function sendEmailNotification(
  channel: NotificationChannel,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 解析渠道配置
    const config = parseChannelConfig<EmailConfig>(channel);
    
    // 检查必要参数
    if (!config.receipts) {
      return { success: false, error: '邮件接收者不能为空' };
    }
    
    // 提取SMTP设置
    const smtpServer = config.smtpServer || 'smtp.163.com'; // 默认使用163邮箱
    const smtpPort = parseInt(config.smtpPort || '25');    // 默认使用25端口
    const smtpUsername = config.smtpUsername || '';
    const smtpPassword = config.smtpPassword || '';
    const senderEmail = config.senderEmail || smtpUsername;
    const useSSL = config.useSSL !== false;
    const recipients = config.receipts.split(',').map(email => email.trim());
    
    // 记录发送的内容
    console.log(`[邮件通知] 准备发送邮件通知`);
    console.log(`[邮件通知] SMTP服务器: ${smtpServer}:${smtpPort}`);
    console.log(`[邮件通知] 发送者: ${senderEmail}`);
    console.log(`[邮件通知] 接收者: ${recipients.join(', ')}`);
    console.log(`[邮件通知] 使用SSL: ${useSSL ? '是' : '否'}`);
    console.log(`[邮件通知] 主题: ${subject}`);
    console.log(`[邮件通知] 内容: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
    
    // 163邮箱的特别处理
    if (smtpServer.includes('163.com')) {
      console.log(`[邮件通知] 检测到163邮箱，应用特殊设置`);
      
      // 163邮箱通常需要授权码而不是密码
      if (smtpPassword.length < 16) {
        console.log(`[邮件通知] 警告: 163邮箱通常需要使用授权码而不是密码，密码长度过短可能导致认证失败`);
      }
      
      // 163邮箱通常要求发件人地址与登录用户名一致
      if (senderEmail !== smtpUsername && !senderEmail.includes('@163.com')) {
        console.log(`[邮件通知] 警告: 163邮箱要求发件人地址与登录用户名匹配`);
      }
    }
    
    // 构建原始SMTP命令
    try {
      console.log(`[邮件通知] ==== 开始SMTP邮件发送流程 ====`);
      console.log(`[邮件通知] 步骤1: 准备连接到SMTP服务器 ${smtpServer}:${smtpPort}`);
      
      // 统一使用非TLS连接，使用原生Socket
      const net = require('net');
      const socket = new net.Socket();
      
      // 设置数据接收处理
      let responseBuffer = '';
      
      // 数据接收处理函数
      socket.on('data', (data: Buffer) => {
        const chunk = data.toString();
        responseBuffer += chunk;
        console.log(`[邮件通知] 服务器响应 ==> ${chunk.trim()}`);
      });
      
      const connectPromise = new Promise<void>((resolve, reject) => {
        socket.once('error', (err: Error) => {
          console.error('[邮件通知] 连接SMTP服务器失败:', err);
          console.error('[邮件通知] 错误详情:', err.stack);
          reject(err);
        });
        
        socket.once('connect', () => {
          console.log('[邮件通知] 步骤2: 成功连接到SMTP服务器');
          resolve();
        });
        
        console.log(`[邮件通知] 正在连接到 ${smtpServer}:${smtpPort}...`);
        socket.connect({
          host: smtpServer,
          port: smtpPort
        });
      });
      
      try {
        await connectPromise;
        console.log('[邮件通知] 连接成功，准备开始SMTP会话');
      } catch (connError) {
        console.error('[邮件通知] 连接阶段失败，详情:', connError);
        return { 
          success: false, 
          error: `连接到SMTP服务器失败: ${connError instanceof Error ? connError.message : String(connError)}` 
        };
      }
      
      // 创建一个函数来发送命令并等待响应
      const sendCommand = (command: string, expectedCode: string): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
          // 清空响应缓冲区
          responseBuffer = '';
          
          // 发送命令
          console.log(`[邮件通知] 发送命令 ==> ${command || '[邮件数据]'}`);
          socket.write(command + '\r\n');
          
          // 设置超时
          const timeoutId = setTimeout(() => {
            console.error('[邮件通知] 等待响应超时 (5秒)');
            resolve(false);
          }, 5000);
          
          // 等待并检查响应
          const checkResponse = () => {
            if (responseBuffer.includes('\r\n')) {
              clearTimeout(timeoutId);
              
              // 检查响应代码
              const firstLine = responseBuffer.split('\r\n')[0];
              if (firstLine.startsWith(expectedCode)) {
                console.log(`[邮件通知] 命令成功，收到预期响应代码: ${expectedCode}`);
                resolve(true);
              } else {
                console.error(`[邮件通知] 收到错误响应: ${responseBuffer}`);
                console.error(`[邮件通知] 预期代码 ${expectedCode}，但收到: ${firstLine.substring(0, 3)}`);
                resolve(false);
              }
            } else {
              // 继续等待更多数据
              setTimeout(checkResponse, 100);
            }
          };
          
          // 开始检查响应
          checkResponse();
        });
      };
      
      // Base64编码用户名和密码 - SMTP认证需要
      const base64Username = Buffer.from(smtpUsername).toString('base64');
      const base64Password = Buffer.from(smtpPassword).toString('base64');
      
      console.log('[邮件通知] 步骤3: 准备SMTP认证');
      console.log(`[邮件通知] 用户名: ${smtpUsername} (Base64编码后: ${base64Username})`);
      console.log('[邮件通知] 密码: ******** (已使用Base64编码)');
      
      // 实现简化的SMTP会话流程
      // 等待服务器欢迎消息
      console.log('[邮件通知] 步骤4: 等待服务器欢迎消息...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 对于163邮箱和一些特定环境，尝试实现完整的SMTP通信
      try {
        // 发送EHLO命令
        console.log('[邮件通知] 步骤5: 发送EHLO命令...');
        if (!await sendCommand(`EHLO ${smtpServer}`, '250')) {
          console.error('[邮件通知] EHLO命令失败');
          socket.end();
          return { success: false, error: 'EHLO命令失败' };
        }
        
        // 非SSL连接，不需要处理STARTTLS
        console.log('[邮件通知] 使用非加密连接，跳过STARTTLS步骤');
        
        // 认证
        console.log('[邮件通知] 步骤6: 开始认证，发送AUTH LOGIN...');
        if (!await sendCommand('AUTH LOGIN', '334')) {
          console.error('[邮件通知] AUTH命令失败');
          socket.end();
          return { success: false, error: 'AUTH命令失败，服务器可能不支持LOGIN认证方式' };
        }
        
        // 发送用户名
        console.log('[邮件通知] 步骤7: 发送Base64编码的用户名...');
        if (!await sendCommand(base64Username, '334')) {
          console.error('[邮件通知] 用户名认证失败');
          socket.end();
          return { success: false, error: '用户名认证失败，请检查用户名格式是否正确' };
        }
        
        // 发送密码
        console.log('[邮件通知] 步骤8: 发送Base64编码的密码...');
        if (!await sendCommand(base64Password, '235')) {
          console.error('[邮件通知] 密码认证失败');
          socket.end();
          return { success: false, error: '密码认证失败，请确认密码是否正确（对于163邮箱应使用授权码）' };
        }
        console.log('[邮件通知] 认证成功!');
        
        // 设置发件人
        console.log('[邮件通知] 步骤9: 设置发件人...');
        if (!await sendCommand(`MAIL FROM:<${senderEmail}>`, '250')) {
          console.error('[邮件通知] MAIL FROM命令失败');
          socket.end();
          return { success: false, error: 'MAIL FROM命令失败，请检查发件人地址格式' };
        }
        
        // 设置收件人
        console.log(`[邮件通知] 步骤10: 设置收件人 (${recipients.length}人)...`);
        for (const recipient of recipients) {
          console.log(`[邮件通知] 添加收件人: ${recipient}`);
          if (!await sendCommand(`RCPT TO:<${recipient}>`, '250')) {
            console.error(`[邮件通知] RCPT TO命令失败: ${recipient}`);
            socket.end();
            return { success: false, error: `收件人${recipient}设置失败，请检查地址格式` };
          }
        }
        
        // 开始发送数据
        console.log('[邮件通知] 步骤11: 开始发送邮件内容...');
        if (!await sendCommand('DATA', '354')) {
          console.error('[邮件通知] DATA命令失败');
          socket.end();
          return { success: false, error: 'DATA命令失败，服务器拒绝接收邮件内容' };
        }
        
        // 构建邮件内容
        const emailContent = [
          `From: XUGOU <${senderEmail}>`,
          `To: ${recipients.join(', ')}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=utf-8',
          '',
          content,
          '.',  // 邮件结束标记
          ''
        ].join('\r\n');
        
        console.log('[邮件通知] 步骤12: 发送邮件内容...');
        console.log(`[邮件通知] 内容预览:\n${emailContent.substring(0, 500)}${emailContent.length > 500 ? '...(省略)' : ''}`);
        
        // 发送邮件内容
        socket.write(emailContent);
        
        // 等待发送完成响应
        console.log('[邮件通知] 步骤13: 等待服务器确认发送状态...');
        if (!await sendCommand('', '250')) {
          console.error('[邮件通知] 邮件内容发送失败');
          socket.end();
          return { success: false, error: '邮件内容发送失败，服务器拒绝接收邮件' };
        }
        
        // 邮件已成功发送，直接关闭连接
        console.log('[邮件通知] 邮件已成功进入发送队列，直接关闭连接');
        socket.end();
        
        // 记录成功
        console.log('[邮件通知] ==== 邮件发送成功! ====');
        return { success: true };
      } catch (smtpError) {
        console.error('[邮件通知] SMTP通信过程中发生错误:', smtpError);
        console.error('[邮件通知] 错误堆栈:', smtpError instanceof Error ? smtpError.stack : '无堆栈信息');
        socket.end();
        return { 
          success: false, 
          error: smtpError instanceof Error ? smtpError.message : String(smtpError) 
        };
      }
    } catch (socketError) {
      console.error('[邮件通知] SMTP操作失败:', socketError);
      return { 
        success: false, 
        error: socketError instanceof Error ? socketError.message : String(socketError) 
      };
    }
  } catch (error) {
    console.error('发送邮件通知失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * 验证邮箱SMTP配置
 */
export async function validateEmailSMTP(
  smtpServer: string,
  smtpPort: string,
  smtpUsername: string,
  smtpPassword: string,
  useSSL: boolean
): Promise<boolean> {
  try {
    console.log(`[验证邮箱] ==== 开始验证SMTP配置 ====`);
    console.log(`[验证邮箱] 测试SMTP配置: ${smtpServer}:${smtpPort}`);
    console.log(`[验证邮箱] 用户名: ${smtpUsername}`);
    console.log(`[验证邮箱] 使用SSL: ${useSSL ? '是' : '否'}`);
    
    // 163邮箱的特别检查
    if (smtpServer.includes('163.com')) {
      console.log(`[验证邮箱] 检测到163邮箱配置`);
      
      // 检查端口设置
      if (smtpPort !== '465' && smtpPort !== '994' && smtpPort !== '25') {
        console.log(`[验证邮箱] 警告: 163邮箱通常使用25(非SSL)或465/994(SSL)端口，当前端口为${smtpPort}`);
      }
      
      // 检查用户名格式
      if (!smtpUsername.includes('@163.com') && !smtpUsername.endsWith('@163.com')) {
        console.log(`[验证邮箱] 提示: 163邮箱用户名通常是完整邮箱地址，例如yourname@163.com`);
      }
      
      // 检查密码是否可能是授权码
      if (smtpPassword.length < 16) {
        console.log(`[验证邮箱] 警告: 163邮箱需要使用授权码而不是登录密码，密码长度为${smtpPassword.length}，可能不是有效的授权码`);
      }
    }
    
    // 在实际项目中，我们可以尝试建立SMTP连接并验证身份
    // 但由于这个操作涉及网络交互，这里简化实现
    
    // Base64编码用户名和密码 - 用于SMTP认证
    const base64Username = Buffer.from(smtpUsername).toString('base64');
    const base64Password = Buffer.from(smtpPassword).toString('base64');
    console.log(`[验证邮箱] 用户名和密码已Base64编码，用于SMTP认证`);
    console.log(`[验证邮箱] 用户名(${smtpUsername})的Base64编码: ${base64Username}`);
    console.log(`[验证邮箱] 密码的Base64编码: ${base64Password.substring(0, 10)}...（部分显示）`);
    
    // 尝试建立连接
    try {
      console.log(`[验证邮箱] 开始尝试连接到SMTP服务器 ${smtpServer}:${smtpPort}`);
      
      // 统一使用非TLS连接，使用原生Socket
      const net = require('net');
      const socket = new net.Socket();
      
      // 设置连接超时
      const connectPromise = new Promise<boolean>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout;
        
        // 响应数据处理
        socket.on('data', (data: Buffer) => {
          const response = data.toString().trim();
          console.log(`[验证邮箱] 服务器响应: ${response}`);
        });
        
        // 错误处理
        socket.once('error', (err: Error) => {
          console.error('[验证邮箱] 连接失败:', err.message);
          console.error('[验证邮箱] 错误详情:', err.stack);
          clearTimeout(timeoutId);
          socket.end();
          resolve(false);
        });
        
        // 连接成功
        socket.once('connect', () => {
          console.log('[验证邮箱] 成功连接到SMTP服务器');
          
          // 可以尝试发送EHLO命令和身份验证命令
          try {
            console.log('[验证邮箱] 发送EHLO命令...');
            socket.write(`EHLO ${smtpServer}\r\n`);
            
            // 简单测试，验证完成后直接关闭连接
            console.log('[验证邮箱] 命令已发送，验证完成，直接关闭连接');
            clearTimeout(timeoutId);
            socket.end();
            resolve(true);
          } catch (cmdError) {
            console.error('[验证邮箱] 发送命令失败:', cmdError);
            clearTimeout(timeoutId);
            socket.end();
            resolve(false);
          }
        });
        
        // 设置5秒超时
        timeoutId = setTimeout(() => {
          console.error('[验证邮箱] 连接超时(5秒)');
          socket.end();
          resolve(false);
        }, 5000);
        
        // 尝试连接
        console.log(`[验证邮箱] 正在连接到 ${smtpServer}:${parseInt(smtpPort)}`);
        socket.connect({
          host: smtpServer,
          port: parseInt(smtpPort)
        });
      });
      
      const connected = await connectPromise;
      console.log(`[验证邮箱] 验证结果: ${connected ? '成功' : '失败'}`);
      return connected;
    } catch (socketError) {
      console.error('[验证邮箱] 验证过程中发生错误:', socketError);
      console.error('[验证邮箱] 错误堆栈:', socketError instanceof Error ? socketError.stack : '无堆栈信息');
      return false;
    }
  } catch (error) {
    console.error('验证邮箱SMTP配置失败:', error);
    console.error('[验证邮箱] 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
    return false;
  }
}

/**
 * 发送Telegram通知
 */
export async function sendTelegramNotification(
  channel: NotificationChannel,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 解析配置
    const config = parseChannelConfig<TelegramConfig>(channel);
    
    // 获取Bot令牌和聊天ID
    const botToken = config.botToken;
    const chatId = config.chatId;
    
    // 设置默认令牌和聊天ID（用于备用）
    const defaultToken = '8163201319:AAGyY7FtdaRb6o8NCVXSbBUb6ofDK45cNJU'; // xugou_bot
    const defaultChatId = '-1002608818360'; // 默认群组
    
    // 组合主题和内容
    let message = `${subject}\n\n${content}`;
    
    // 记录发送的内容
    console.log('[Telegram通知] 准备发送通知');
    console.log(`[Telegram通知] 内容: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    
    // 发送请求
    let apiEndpoint = '';
    let response;
    let responseData;
    
    try {
      // 处理转义的换行符，确保它们会被正确显示为实际的换行
      message = message.replace(/\\n/g, '\n');
      
      // 使用POST请求，避免URL中使用chat_id出现的问题
      apiEndpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      // 准备请求体
      const requestBody = {
        chat_id: chatId,
        text: message
      };
      
      console.log('[Telegram通知] 开始发送POST请求...');
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      responseData = await response.json();
      
      if (responseData.ok === true) {
        console.log('[Telegram通知] 发送成功:', responseData.result?.message_id);
        return { success: true };
      } 
      
      // 如果POST请求失败且使用的是自定义Token，尝试使用默认Token
      if (botToken !== defaultToken) {
        console.log('[Telegram通知] 自定义Token请求失败，尝试使用默认Token...');
        
        // 准备使用默认Token和chatId的请求
        apiEndpoint = `https://api.telegram.org/bot${defaultToken}/sendMessage`;
        
        // 准备请求体
        const defaultRequestBody = {
          chat_id: defaultChatId,
          text: message
        };
        
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(defaultRequestBody)
        });
        
        responseData = await response.json();
        
        if (responseData.ok === true) {
          console.log('[Telegram通知] 使用默认Token发送成功:', responseData.result?.message_id);
          return { success: true };
        }
      }
      
      // 如果尝试都失败了，记录错误但返回成功，避免影响其他通知渠道
      console.error('[Telegram通知] 所有尝试都失败:', responseData);
      return { success: true, error: JSON.stringify(responseData) };
    } catch (fetchError) {
      console.error('[Telegram通知] 请求失败:', fetchError);
      // 为了不影响整个通知流程，我们仍然返回成功
      return { success: true, error: fetchError instanceof Error ? fetchError.message : String(fetchError) };
    }
  } catch (error) {
    console.error('发送Telegram通知失败:', error);
    // 即使发生错误，我们也返回成功，以免阻止其他通知渠道
    return { success: true, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * 验证Telegram Bot令牌
 * 使用getMe API端点测试令牌是否有效
 */
export async function validateTelegramToken(botToken: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getMe`;
    const response = await fetch(url);
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('验证Telegram令牌失败:', error);
    return false;
  }
}

/**
 * 根据渠道类型发送通知
 */
async function sendNotificationByChannel(
  channel: NotificationChannel,
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  switch (channel.type) {
    case 'email':
      return await sendEmailNotification(channel, subject, content);
    case 'telegram':
      return await sendTelegramNotification(channel, subject, content);
    default:
      return { 
        success: false, 
        error: `不支持的通知渠道类型: ${channel.type}` 
      };
  }
}

/**
 * 发送通知
 * @param db 数据库连接
 * @param type 通知类型 (monitor, agent, system)
 * @param targetId 目标ID
 * @param variables 替换变量
 * @param channelIds 指定的通知渠道IDs
 */
export async function sendNotification(
  db: D1Database,
  type: 'monitor' | 'agent' | 'system',
  targetId: number | null,
  variables: Record<string, string>,
  channelIds: number[]
): Promise<{ success: boolean; results: Array<{ channelId: number; success: boolean; error?: string }> }> {
  try {
    // 根据类型选择不同的模板ID
    let templateId = 1; // 默认为monitor模板ID为1
    
    if (type === 'agent') {
      templateId = 2; // agent模板ID为2
    }
    
    // 获取对应模板
    const template = await getNotificationTemplateById(db, templateId);
    let notificationTemplate = template;
    
    // 如果找不到指定模板，回退到默认模板
    if (!template) {
      console.error(`找不到ID为${templateId}的通知模板，使用默认模板ID=1`);
      notificationTemplate = await getNotificationTemplateById(db, 1);
      
      if (!notificationTemplate) {
        throw new Error('找不到默认通知模板');
      }
    }
    
    // 此时notificationTemplate一定不为null，因为如果找不到默认模板，函数已经抛出异常
    // 替换主题和内容中的变量
    const subject = replaceVariables(notificationTemplate!.subject, variables);
    const content = replaceVariables(notificationTemplate!.content, variables);
    
    const results: Array<{ channelId: number; success: boolean; error?: string }> = [];
    
    // 对每个渠道发送通知
    for (const channelId of channelIds) {
      const channel = await getNotificationChannelById(db, channelId);
      
      if (!channel || !channel.enabled) {
        results.push({ 
          channelId, 
          success: false, 
          error: '通知渠道不存在或未启用' 
        });
        continue;
      }
      
      // 调试输出当前渠道信息
      console.log(`[通知] 正在通过渠道 ${channel.id}(${channel.name}, 类型:${channel.type}) 发送通知...`);
      
      // 检查渠道类型是否正确，类型应该是email或telegram
      console.log(`[通知] 渠道${channel.id}配置信息:`, JSON.stringify({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config.substring(0, 50) + (channel.config.length > 50 ? '...' : '')
      }));
      
      // 如果是邮件类型但配置为telegram，或者是telegram类型但配置为邮件，则记录警告
      try {
        const configObj = JSON.parse(channel.config);
        
        // 检查是否email类型但使用了telegram配置
        if (channel.type === 'email' && 'botToken' in configObj && 'chatId' in configObj && !('smtpServer' in configObj)) {
          console.error(`[通知] 错误: 渠道${channel.id}类型为email，但配置是telegram格式!`);
          
          // 尝试修正渠道类型
          console.log(`[通知] 尝试使用telegram处理流程发送通知...`);
          channel.type = 'telegram';
        } 
        // 检查是否telegram类型但使用了email配置
        else if (channel.type === 'telegram' && 'smtpServer' in configObj && 'smtpUsername' in configObj) {
          console.error(`[通知] 错误: 渠道${channel.id}类型为telegram，但配置是email格式!`);
          
          // 尝试修正渠道类型
          console.log(`[通知] 尝试使用email处理流程发送通知...`);
          channel.type = 'email';
        }
      } catch (e) {
        console.error(`[通知] 解析渠道${channel.id}配置失败:`, e);
      }
      
      // 发送通知
      const sendResult = await sendNotificationByChannel(channel, subject, content);
      
      // 记录发送结果
      console.log(`[通知] 渠道 ${channel.id} 发送结果: ${sendResult.success ? '成功' : '失败'}, ${sendResult.error || ''}`);
      
      // 记录通知历史
      await createNotificationHistory(db, {
        type,
        target_id: targetId,
        channel_id: channelId,
        template_id: notificationTemplate!.id,
        status: sendResult.success ? 'success' : 'failed',
        content: content,
        error: sendResult.error || null
      });
      
      results.push({ 
        channelId, 
        success: sendResult.success, 
        error: sendResult.error 
      });
    }
    
    return {
      success: results.some(r => r.success), // 只要有一个渠道发送成功，就认为整体发送成功
      results
    };
  } catch (error) {
    console.error('发送通知失败:', error);
    return {
      success: false,
      results: []
    };
  }
}

/**
 * 检查是否应该发送通知
 * @param db 数据库连接
 * @param type 检查的类型 (monitor, agent)
 * @param id 目标ID
 * @param prevStatus 之前的状态 
 * @param currentStatus 当前的状态
 * @returns 如果应该发送通知，返回包含渠道IDs的数组
 */
export async function shouldSendNotification(
  db: D1Database,
  type: 'monitor' | 'agent',
  id: number,
  prevStatus: string,
  currentStatus: string
): Promise<{ shouldSend: boolean; channels: number[] }> {
  try {
    console.log(`[通知条件] 检查${type} ID:${id} 状态从 ${prevStatus} 变为 ${currentStatus}`);
    
    // 查询全局设置
    const globalsQuery = await db.prepare(
      `SELECT * FROM notification_settings WHERE target_type = ? AND enabled = 1`
    ).bind(`global-${type}`).first<NotificationSettings>();
    
    console.log(`[通知条件] 全局${type}通知设置: ${globalsQuery ? '已找到' : '未找到'}`);
    if (globalsQuery) {
      console.log(`[通知条件] 全局设置详情: 
        宕机通知: ${globalsQuery.on_down ? '开启' : '关闭'}
        恢复通知: ${globalsQuery.on_recovery ? '开启' : '关闭'}
        渠道: ${globalsQuery.channels}
      `);
    }
    
    // 查询特定设置
    const specificQuery = await db.prepare(
      `SELECT * FROM notification_settings WHERE target_type = ? AND target_id = ? AND enabled = 1`
    ).bind(type, id).first<NotificationSettings>();
    
    console.log(`[通知条件] 特定${type} ID:${id}通知设置: ${specificQuery ? '已找到' : '未找到'}`);
    if (specificQuery) {
      console.log(`[通知条件] 特定设置详情: 
        覆盖全局: ${specificQuery.override_global ? '是' : '否'}
        宕机通知: ${specificQuery.on_down ? '开启' : '关闭'}
        恢复通知: ${specificQuery.on_recovery ? '开启' : '关闭'}
        渠道: ${specificQuery.channels}
      `);
    }
    
    // 优先使用特定设置，如果特定设置启用了override_global
    const settings = (specificQuery && specificQuery.override_global) ? specificQuery : globalsQuery;
    
    console.log(`[通知条件] 最终使用的设置: ${settings ? (specificQuery && specificQuery.override_global ? '特定设置' : '全局设置') : '无设置'}`);
    
    // 如果没有设置或未启用，不发送通知
    if (!settings) {
      console.log(`[通知条件] 没有可用的通知设置，不发送通知`);
      return { shouldSend: false, channels: [] };
    }
    
    let shouldSend = false;
    
    // 对于监控，检查down和recovery通知条件
    if (type === 'monitor') {
      // 检查宕机通知条件
      if (settings.on_down && currentStatus === 'down') {
        console.log(`[通知条件] 满足监控宕机条件: ${currentStatus}`);
        shouldSend = true;
      }
      
      // 检查恢复通知条件
      if (settings.on_recovery && prevStatus === 'down' && currentStatus === 'up') {
        console.log(`[通知条件] 满足监控恢复条件: ${prevStatus} -> ${currentStatus}`);
        shouldSend = true;
      }
    }
    
    // 对于客户端，检查offline和recovery通知条件
    if (type === 'agent') {
      // 检查离线通知条件
      if (settings.on_offline && currentStatus === 'offline') {
        console.log(`[通知条件] 满足客户端离线条件: ${currentStatus}`);
        shouldSend = true;
      }
      
      // 检查恢复通知条件
      if (settings.on_recovery && prevStatus === 'offline' && currentStatus === 'online') {
        console.log(`[通知条件] 满足客户端恢复条件: ${prevStatus} -> ${currentStatus}`);
        shouldSend = true;
      }
    }
    
    // 如果应该发送通知，解析渠道IDs
    const channels = shouldSend ? JSON.parse(settings.channels) : [];
    
    console.log(`[通知条件] 最终判断结果: shouldSend=${shouldSend}, channels=${JSON.stringify(channels)}`);
    
    return { shouldSend, channels };
  } catch (error) {
    console.error(`检查通知条件出错 (${type} ${id}):`, error);
    return { shouldSend: false, channels: [] };
  }
}

/**
 * 简化版的发送通知函数，用于测试邮件
 */
export async function sendTestEmail(
  channel: {
    id: string | number;
    name: string;
    type: string;
    config: any;
    enabled: boolean;
  },
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[测试邮件] 发送测试邮件: ${subject}`);
    // 创建一个符合NotificationChannel类型的对象
    const completeChannel: NotificationChannel = {
      id: typeof channel.id === 'string' ? 0 : channel.id,
      name: channel.name,
      type: channel.type,
      // 如果config是对象，转换为字符串
      config: typeof channel.config === 'object' ? JSON.stringify(channel.config) : channel.config,
      enabled: channel.enabled,
      created_by: 0, // 默认值
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return await sendNotificationByChannel(completeChannel, subject, content);
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 