import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { createHackathon } from '@/lib/minio-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import CriteriaForm from '@/components/ui/criteria-form';
import { Criteria } from '@shared/schema';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

export default function CreateHackathon() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    theme: '',
    description: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    cutoff_score:[0, 0]
  });
  
  const [criteriaList, setCriteriaList] = useState<Criteria[]>([]);
  
  const createHackathonMutation = useMutation({
    mutationFn: createHackathon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hackathons'] });
      toast({
        title: "Hackathon created",
        description: "Your new hackathon has been created successfully."
      });
      navigate('/hackathons');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create hackathon",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.theme || !formData.description) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    if (criteriaList.length === 0) {
      toast({
        title: "Validation error",
        description: "Please add at least one evaluation criterion.",
        variant: "destructive"
      });
      return;
    }
    
    // Check date validation
    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Validation error",
        description: "Please select start and end dates.",
        variant: "destructive"
      });
      return;
    }

    // Validate date order
    if (formData.start_date > formData.end_date) {
      toast({
        title: "Validation error",
        description: "Start date must be before end date.",
        variant: "destructive"
      });
      return;
    }

    // Validate cutoff scores
    const medium = formData.cutoff_score[0];
    const high = formData.cutoff_score[1];
    if (high <= medium || high > 100 || medium <= 0) {
      toast({
        title: "Validation error",
        description: "Invalid cutoff scores. Ensure: 0 < Medium < High ≤ 100",
        variant: "destructive"
      });
      return;
    }
    
    // Check if criteria weightages sum to 100%
    const totalWeightage = criteriaList.reduce((sum, crit) => sum + crit.weightage, 0);
    if (totalWeightage !== 100) {
      toast({
        title: "Validation error",
        description: `Total criteria weightage should be 100%. Current: ${totalWeightage}%`,
        variant: "destructive"
      });
      return;
    }
    
    // Create hackathon
    createHackathonMutation.mutate({
      ...formData,
      criteria: criteriaList,
      status: 'in_progress'
    });
  };
  
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/hackathons')}
          className="mr-4"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 truncate">Create New Hackathon</h1>
          <p className="text-gray-600">Set up a new hackathon for evaluation</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Hackathon Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="hackathon-name">Hackathon Name</Label>
                <Input
                  id="hackathon-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="hackathon-theme">Theme</Label>
                <Input
                  id="hackathon-theme"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="hackathon-description">Description</Label>
                <Textarea
                  id="hackathon-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white",
                          !formData.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(formData.start_date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => setFormData({ ...formData, start_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white",
                          !formData.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? (
                          format(formData.end_date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => setFormData({ ...formData, end_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                
                <div>
                  <Label htmlFor="cutoff-medium">Cutoff Score for Medium (in %)</Label>
                  <Input
                    id="cutoff-medium"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.cutoff_score[0]}
                    onChange={(e) => setFormData({
                      ...formData,
                      cutoff_score: [parseInt(e.target.value), formData.cutoff_score[1]]
                    })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cutoff-high">Cutoff Score for High (in %)</Label>
                  <Input
                    id="cutoff-high"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.cutoff_score[1]}
                    onChange={(e) => setFormData({
                      ...formData,
                      cutoff_score: [formData.cutoff_score[0], parseInt(e.target.value)]
                    })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
              
              {/* Evaluation Criteria */}
              <div className="pt-2">
                <CriteriaForm 
                  criteriaList={criteriaList}
                  setCriteriaList={setCriteriaList}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/hackathons')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createHackathonMutation.isPending}
              >
                {createHackathonMutation.isPending ? 'Creating...' : 'Create Hackathon'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}