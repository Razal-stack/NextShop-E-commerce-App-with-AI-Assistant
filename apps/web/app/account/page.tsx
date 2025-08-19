import { ProtectedRoute } from '../../src/components/features/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserProfile from './UserProfile';

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your profile and account preferences</p>
          </div>
          
          <UserProfile />
        </div>
      </div>
    </ProtectedRoute>
  );
}
