import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Category {
    id: string;
    name: string;
}

interface CategoryDropdownProps {
    categories: Category[];
    selectedId: string;
    onSelect: (categoryId: string) => void;
    className?: string;
}

export function CategoryDropdown({ categories, selectedId, onSelect, className }: CategoryDropdownProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const pageSize = 10;

    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

    const filteredCategories = sortedCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCategories.length / pageSize);
    const displayedCategories = filteredCategories.slice(page * pageSize, (page + 1) * pageSize);

    const selectedCategory = categories.find(c => c.id === selectedId);

    // Reset page when search changes
    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    const handleSelect = (id: string) => {
        onSelect(id);
        setOpen(false);
    };

    const handleNextPage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (page < totalPages - 1) setPage(p => p + 1);
    };

    const handlePrevPage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (page > 0) setPage(p => p - 1);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-white border-[#f8d7da] hover:bg-gray-50 text-[#4e342e]", className)}
                >
                    {selectedCategory ? selectedCategory.name : "Select category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-white shadow-xl border-[#d7ccc8]" align="start">
                <div className="p-2 border-b border-[#f8d7da]">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-9 border-[#f8d7da] focus-visible:ring-[#4e342e]"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                    {displayedCategories.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No matching categories available.
                        </div>
                    ) : (
                        <div className="py-1">
                            {displayedCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className={cn(
                                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-[#fdf6f0] hover:text-[#4e342e] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        selectedId === category.id && "bg-[#4e342e] text-white hover:bg-[#3b2c26] hover:text-white"
                                    )}
                                    onClick={() => handleSelect(category.id)}
                                >
                                    <span className="flex-1 truncate">{category.name}</span>
                                    {selectedId === category.id && (
                                        <Check className="ml-auto h-4 w-4" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-2 border-t border-[#f8d7da] bg-[#fdf6f0]/50">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 disabled:opacity-50"
                            onClick={handlePrevPage}
                            disabled={page === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-[#6d4c41]">
                            Page {page + 1} of {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 disabled:opacity-50"
                            onClick={handleNextPage}
                            disabled={page >= totalPages - 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
