# How to Use the User Invitation API Endpoint

## Endpoint Details

**URL:** `POST /api/superadmin/users/invite`  
**Authentication:** Required (Super Admin only)  
**Content-Type:** `application/json`

## Request Body

```json
{
  "email": "user@example.com",
  "role": "employee",
  "salonId": "salon-id-here",
  "redirectTo": "/admin"
}
```

### Parameters

- **email** (required): The email address of the user to invite
- **role** (required): User role - must be one of: `"owner"`, `"admin"`, or `"employee"`
- **salonId** (required): The ID of the salon to assign the user to
- **redirectTo** (optional): Where to redirect after email confirmation. Defaults to `"/admin"`

## Response

### Success Response (200)

```json
{
  "success": true,
  "user": {
    "id": "user-uuid-here",
    "email": "user@example.com",
    "role": "employee",
    "salonId": "salon-id-here"
  },
  "message": "Invitation email sent successfully"
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Email, role, and salonId are required"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid role. Must be owner, admin, or employee"
}
```

**401 Unauthorized:**
```json
{
  "error": "Not authenticated"
}
```

**403 Forbidden:**
```json
{
  "error": "Super admin access required"
}
```

## Usage Examples

### 1. Using cURL (Command Line)

**Local Development:**
```bash
curl -X POST http://localhost:5000/api/superadmin/users/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "email": "employee@salon.com",
    "role": "employee",
    "salonId": "your-salon-id",
    "redirectTo": "/admin"
  }'
```

**Production (Vercel):**
```bash
curl -X POST https://your-project.vercel.app/api/superadmin/users/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "email": "employee@salon.com",
    "role": "employee",
    "salonId": "your-salon-id",
    "redirectTo": "/admin"
  }'
```

### 2. Using JavaScript/TypeScript (Fetch API)

```typescript
async function inviteUser(email: string, role: string, salonId: string) {
  try {
    const response = await fetch('/api/superadmin/users/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: includes cookies for authentication
      body: JSON.stringify({
        email,
        role,
        salonId,
        redirectTo: '/admin', // Optional
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to invite user');
    }

    const result = await response.json();
    console.log('User invited successfully:', result);
    return result;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
}

// Usage
inviteUser('employee@salon.com', 'employee', 'salon-id-here')
  .then(result => {
    console.log('Success:', result.message);
  })
  .catch(error => {
    console.error('Failed:', error.message);
  });
```

### 3. Using React Component with Form

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface InviteUserForm {
  email: string;
  role: 'owner' | 'admin' | 'employee';
  salonId: string;
}

export function InviteUserForm({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<InviteUserForm>({
    defaultValues: {
      salonId,
      role: 'employee',
    },
  });

  const onSubmit = async (data: InviteUserForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/superadmin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          redirectTo: '/admin',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite user');
      }

      const result = await response.json();
      
      toast({
        title: 'Success!',
        description: `Invitation sent to ${data.email}`,
      });
      
      reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          {...register('email', { required: true })}
          placeholder="user@example.com"
        />
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select
          id="role"
          {...register('role', { required: true })}
          className="w-full p-2 border rounded"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </div>

      <input type="hidden" {...register('salonId')} />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Invitation'}
      </Button>
    </form>
  );
}
```

### 4. Using React Query (TanStack Query)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

function useInviteUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      role: string;
      salonId: string;
      redirectTo?: string;
    }) => {
      const response = await fetch('/api/superadmin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite user');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Success!',
        description: `Invitation sent to ${variables.email}`,
      });
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Usage in component
function InviteUserButton() {
  const inviteUser = useInviteUser();

  const handleInvite = () => {
    inviteUser.mutate({
      email: 'employee@salon.com',
      role: 'employee',
      salonId: 'salon-id-here',
    });
  };

  return (
    <button 
      onClick={handleInvite}
      disabled={inviteUser.isPending}
    >
      {inviteUser.isPending ? 'Sending...' : 'Invite User'}
    </button>
  );
}
```

### 5. Using Postman or Insomnia

1. **Method:** POST
2. **URL:** `https://your-project.vercel.app/api/superadmin/users/invite`
3. **Headers:**
   - `Content-Type: application/json`
   - `Cookie: connect.sid=your-session-cookie` (get this from browser after logging in)
4. **Body (JSON):**
   ```json
   {
     "email": "user@example.com",
     "role": "employee",
     "salonId": "salon-id-here",
     "redirectTo": "/admin"
   }
   ```

## Getting the Salon ID

Before inviting a user, you need the salon ID. You can get it from:

1. **API Endpoint:** `GET /api/superadmin/salons`
   ```typescript
   const response = await fetch('/api/superadmin/salons', {
     credentials: 'include',
   });
   const salons = await response.json();
   const salonId = salons[0].id; // Use the first salon or select one
   ```

2. **From Database:** Check your Supabase dashboard or database directly

3. **From Current User:** If you're logged in as a salon user:
   ```typescript
   const response = await fetch('/api/admin/salon', {
     credentials: 'include',
   });
   const { salon } = await response.json();
   const salonId = salon.id;
   ```

## Authentication

This endpoint requires:
1. **Valid session cookie** - You must be logged in
2. **Super Admin role** - Your email must match `SUPER_ADMIN_EMAIL` in environment variables

To authenticate:
1. Log in first: `POST /api/login` with your super admin credentials
2. The session cookie will be set automatically
3. Use that cookie in subsequent requests

## Testing the Endpoint

### Step 1: Get Your Salon ID

```bash
# Get all salons
curl http://localhost:5000/api/superadmin/salons \
  -H "Cookie: connect.sid=your-session-cookie"
```

### Step 2: Invite a User

```bash
curl -X POST http://localhost:5000/api/superadmin/users/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "email": "test@example.com",
    "role": "employee",
    "salonId": "your-salon-id-from-step-1"
  }'
```

### Step 3: Check the Response

You should receive:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "role": "employee",
    "salonId": "..."
  },
  "message": "Invitation email sent successfully"
}
```

### Step 4: Check Email

The user should receive an email with a confirmation link. The link will:
- Point to your configured domain
- Include the correct redirect URL
- Allow the user to set their password
- Redirect them to `/admin` after confirmation

## Common Issues

### Issue: "Super admin access required"
**Solution:** Make sure your email matches `SUPER_ADMIN_EMAIL` in your `.env.local` file

### Issue: "Email, role, and salonId are required"
**Solution:** Check that all required fields are included in the request body

### Issue: "Invalid role"
**Solution:** Role must be exactly one of: `"owner"`, `"admin"`, or `"employee"` (case-sensitive)

### Issue: User receives email but link doesn't work
**Solution:** 
1. Check Supabase Site URL configuration (see `USER_INVITATION_GUIDE.md`)
2. Verify redirect URLs are set correctly in Supabase Dashboard
3. Make sure `APP_URL` environment variable is set

### Issue: CORS errors
**Solution:** Make sure you're using `credentials: 'include'` in fetch requests

## Next Steps

After inviting a user:
1. The user receives an email with a confirmation link
2. User clicks the link and sets their password
3. User is automatically redirected to `/admin`
4. User is already linked to the salon with the specified role
5. User can immediately start using the system

No additional steps needed - the user is fully set up!

