import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

// Initialize Prisma client
const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    const onData = function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          process.stdin.removeListener('data', onData);
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function createSuperAdmin() {
  try {
    console.log('🔧 Creating Superadmin User for TradeFair');
    console.log('=====================================\n');
    
    // Get user input
    const email = await askQuestion('Enter superadmin email: ');
    const firstName = await askQuestion('Enter first name: ');
    const lastName = await askQuestion('Enter last name: ');
    const phone = await askQuestion('Enter phone number (optional): ');
    const password = await askPassword('Enter password: ');
    const confirmPassword = await askPassword('Confirm password: ');
    
    // Validate input
    if (!email || !firstName || !lastName || !password) {
      console.log('\n❌ All fields except phone are required!');
      
    }
    
    if (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match!');
      
    }
    
    if (password.length < 8) {
      console.log('\n❌ Password must be at least 8 characters long!');
      
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });
    
    if (existingUser) {
      console.log('\n❌ User with this email already exists!');
     
    }
    
    // Hash password
    console.log('\n🔄 Creating superadmin user...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create superadmin user
    const newUser = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        firstName,
        lastName,
        password: hashedPassword,
        isActive: true,
        isAdmin: true,
        isStaff: true,
        currency: 'INR' // Default currency
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        isStaff: true,
        createdAt: true
      }
    });
    
    console.log('\n🎉 Superadmin user created successfully!');
    console.log('=====================================');
    console.log(`ID: ${newUser.id}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Name: ${newUser.firstName} ${newUser.lastName}`);
    console.log(`Admin: ${newUser.isAdmin}`);
    console.log(`Staff: ${newUser.isStaff}`);
    console.log(`Created: ${newUser.createdAt}`);
    console.log('=====================================\n');
    
  } catch (error) {
    console.error('\n❌ Error creating superadmin:', error);
    
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the superadmin creation
createSuperAdmin();
