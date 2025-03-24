import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Criteria } from '@shared/schema';

interface CriteriaFormProps {
  criteriaList: Criteria[];
  setCriteriaList: (criteria: Criteria[]) => void;
}

export default function CriteriaForm({ criteriaList, setCriteriaList }: CriteriaFormProps) {
  const [newCriteria, setNewCriteria] = useState<Criteria>({
    name: '',
    description: '',
    weightage: 0
  });
  
  const handleAddCriteria = () => {
    // Validate criteria
    if (!newCriteria.name || !newCriteria.description || newCriteria.weightage <= 0) {
      return;
    }
    
    // Add to list
    setCriteriaList([...criteriaList, { ...newCriteria }]);
    
    // Reset form
    setNewCriteria({
      name: '',
      description: '',
      weightage: 0
    });
  };
  
  const handleRemoveCriteria = (index: number) => {
    const updatedCriteria = [...criteriaList];
    updatedCriteria.splice(index, 1);
    setCriteriaList(updatedCriteria);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center">
        <Label className="block text-sm font-medium text-gray-700">Evaluation Criteria</Label>
      </div>

      {/* Criteria List */}
      <div className="mt-2 space-y-2">
        {criteriaList.map((criteria, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{criteria.name}</p>
              <p className="text-xs text-gray-500">{criteria.description}</p>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">{criteria.weightage}%</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCriteria(index)}
                className="text-gray-400 hover:text-gray-500"
              >
                <i className="ri-delete-bin-line"></i>
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        ))}

        {criteriaList.length === 0 && (
          <div className="text-sm text-gray-500 p-2">
            No criteria added yet. Add at least one criterion below.
          </div>
        )}
      </div>

      {/* Add New Criteria */}
      <div className="mt-3 border-t pt-3">
        <div className="space-y-2">
          <div>
            <Label htmlFor="criteria-name" className="block text-xs font-medium text-gray-700">
              Criteria Name
            </Label>
            <Input
              id="criteria-name"
              value={newCriteria.name}
              onChange={(e) => setNewCriteria({ ...newCriteria, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="criteria-description" className="block text-xs font-medium text-gray-700">
              Description
            </Label>
            <Input
              id="criteria-description"
              value={newCriteria.description}
              onChange={(e) => setNewCriteria({ ...newCriteria, description: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="criteria-weightage" className="block text-xs font-medium text-gray-700">
              Weightage (%)
            </Label>
            <Input
              id="criteria-weightage"
              type="number"
              min="0"
              max="100"
              value={newCriteria.weightage.toString()}
              onChange={(e) => setNewCriteria({ ...newCriteria, weightage: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCriteria}
            className="mt-2"
            disabled={!newCriteria.name || !newCriteria.description || newCriteria.weightage <= 0}
          >
            <i className="ri-add-line mr-1"></i> Add Criteria
          </Button>
        </div>
      </div>
    </div>
  );
}
