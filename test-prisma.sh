# test-prisma-file.sh - Check Prisma file directly

echo "🔍 CHECKING PRISMA FILE:"
echo "========================"

echo ""
echo "1. Checking if prisma.js exists:"
if [ -f "src/lib/prisma.js" ]; then
  echo "✅ src/lib/prisma.js exists"
  echo "File size: $(wc -c < src/lib/prisma.js) bytes"
else
  echo "❌ src/lib/prisma.js does NOT exist"
  echo "Looking for alternatives..."
  find . -name "*prisma*" -type f | head -10
fi

echo ""
echo "2. Testing prisma.js file directly:"
if [ -f "src/lib/prisma.js" ]; then
  echo "Content preview:"
  head -5 src/lib/prisma.js
  echo ""
  echo "Testing Node.js syntax:"
  node -c src/lib/prisma.js && echo "✅ Syntax OK" || echo "❌ Syntax Error"
else
  echo "❌ Cannot test - file missing"
fi

echo ""
echo "3. Testing @auth/prisma-adapter package:"
if [ -d "node_modules/@auth/prisma-adapter" ]; then
  echo "✅ @auth/prisma-adapter package exists"
  cat node_modules/@auth/prisma-adapter/package.json | grep '"version"'
else
  echo "❌ @auth/prisma-adapter package missing"
  echo "💡 Run: npm install @auth/prisma-adapter"
fi

echo ""
echo "4. Checking Prisma client generation:"
if [ -d "node_modules/.prisma/client" ]; then
  echo "✅ Prisma client generated"
  ls -la node_modules/.prisma/client/ | head -3
else
  echo "❌ Prisma client not generated"
  echo "💡 Run: npx prisma generate"
fi