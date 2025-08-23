import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, X, ShoppingCart, Login, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface UIHandler {
    type: string;
    description: string;
    data?: any;
    requiresConfirmation?: boolean;
}

interface UIHandlerProps {
    handlers: UIHandler[];
    onConfirm: (handlerType: string, data?: any) => Promise<void>;
    onCancel: (handlerType: string) => void;
}

export const UIHandlerComponent: React.FC<UIHandlerProps> = ({ 
    handlers, 
    onConfirm, 
    onCancel 
}) => {
    const [processingHandlers, setProcessingHandlers] = useState<Set<string>>(new Set());
    const [completedHandlers, setCompletedHandlers] = useState<Set<string>>(new Set());

    const handleConfirm = async (handler: UIHandler, index: number) => {
        const handlerKey = `${handler.type}_${index}`;
        setProcessingHandlers(prev => new Set([...prev, handlerKey]));
        
        try {
            await onConfirm(handler.type, handler.data);
            setCompletedHandlers(prev => new Set([...prev, handlerKey]));
        } catch (error) {
            console.error(`Handler ${handler.type} failed:`, error);
        } finally {
            setProcessingHandlers(prev => {
                const newSet = new Set(prev);
                newSet.delete(handlerKey);
                return newSet;
            });
        }
    };

    const handleCancel = (handler: UIHandler, index: number) => {
        const handlerKey = `${handler.type}_${index}`;
        onCancel(handler.type);
        setCompletedHandlers(prev => {
            const newSet = new Set(prev);
            newSet.delete(handlerKey);
            return newSet;
        });
    };

    const getHandlerIcon = (type: string) => {
        switch (type) {
            case 'add_to_cart':
            case 'remove_from_cart':
                return <ShoppingCart className="h-4 w-4" />;
            case 'login_required':
                return <Login className="h-4 w-4" />;
            case 'show_product_details':
                return <Eye className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getHandlerVariant = (type: string) => {
        switch (type) {
            case 'add_to_cart':
                return 'default';
            case 'remove_from_cart':
                return 'destructive';
            case 'login_required':
                return 'outline';
            case 'show_product_details':
                return 'secondary';
            default:
                return 'default';
        }
    };

    if (handlers.length === 0) return null;

    return (
        <div className="space-y-4 mt-4">
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    I've prepared some actions for you to review. Please confirm or cancel each action below.
                </AlertDescription>
            </Alert>
            
            {handlers.map((handler, index) => {
                const handlerKey = `${handler.type}_${index}`;
                const isProcessing = processingHandlers.has(handlerKey);
                const isCompleted = completedHandlers.has(handlerKey);
                
                return (
                    <Card key={handlerKey} className={`transition-all ${
                        isCompleted ? 'border-green-200 bg-green-50' : 
                        isProcessing ? 'border-blue-200 bg-blue-50' : 
                        'border-gray-200'
                    }`}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {getHandlerIcon(handler.type)}
                                    <CardTitle className="text-sm font-medium">
                                        {handler.type.replace(/_/g, ' ').toUpperCase()}
                                    </CardTitle>
                                    {isCompleted && (
                                        <Badge variant="success" className="flex items-center space-x-1">
                                            <Check className="h-3 w-3" />
                                            <span>Completed</span>
                                        </Badge>
                                    )}
                                    {isProcessing && (
                                        <Badge variant="secondary" className="animate-pulse">
                                            Processing...
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <CardDescription>{handler.description}</CardDescription>
                        </CardHeader>
                        
                        {handler.data && (
                            <CardContent className="pb-3">
                                <div className="bg-gray-50 rounded-md p-3">
                                    {handler.type === 'add_to_cart' && handler.data.products && (
                                        <div>
                                            <p className="text-sm font-medium mb-2">Products to add:</p>
                                            {handler.data.products.slice(0, 3).map((product: any) => (
                                                <div key={product.id} className="flex justify-between items-center py-1">
                                                    <span className="text-sm">{product.title}</span>
                                                    <span className="text-sm font-medium">£{product.price}</span>
                                                </div>
                                            ))}
                                            {handler.data.products.length > 3 && (
                                                <p className="text-sm text-gray-500 mt-2">
                                                    +{handler.data.products.length - 3} more products
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {handler.type === 'remove_from_cart' && handler.data.product_ids && (
                                        <div>
                                            <p className="text-sm font-medium mb-2">Products to remove:</p>
                                            <p className="text-sm">{handler.data.product_ids.length} items</p>
                                        </div>
                                    )}
                                    
                                    {handler.type === 'show_product_details' && handler.data.product_id && (
                                        <div>
                                            <p className="text-sm font-medium mb-2">Product Details:</p>
                                            <p className="text-sm">Product ID: {handler.data.product_id}</p>
                                        </div>
                                    )}
                                    
                                    {handler.type === 'confirmation_required' && handler.data && (
                                        <div>
                                            <p className="text-sm font-medium mb-2">Action Details:</p>
                                            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                                {JSON.stringify(handler.data, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        )}
                        
                        <CardContent className="pt-0">
                            <div className="flex space-x-2">
                                {!isCompleted && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant={getHandlerVariant(handler.type)}
                                            onClick={() => handleConfirm(handler, index)}
                                            disabled={isProcessing}
                                            className="flex-1"
                                        >
                                            {isProcessing ? (
                                                "Processing..."
                                            ) : handler.type === 'login_required' ? (
                                                "Login Now"
                                            ) : handler.type === 'show_product_details' ? (
                                                "View Details"
                                            ) : handler.type === 'remove_from_cart' ? (
                                                "Remove Items"
                                            ) : (
                                                "Confirm"
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCancel(handler, index)}
                                            disabled={isProcessing}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                {isCompleted && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCancel(handler, index)}
                                        className="flex-1"
                                    >
                                        Undo
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
