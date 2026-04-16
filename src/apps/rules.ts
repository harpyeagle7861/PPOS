
import React, { useState, useEffect } from 'react';
import { AppDef, store, Rule } from '../core/state';
import { addNotification } from '../core/windowManager';

const RulesComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [rules, setRules] = useState<Rule[]>(store.getState().rules);
    const [categories, setCategories] = useState<string[]>(store.getState().ruleCategories);
    const [newRuleText, setNewRuleText] = useState('');
    const [newRuleCategory, setNewRuleCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [editingRuleText, setEditingRuleText] = useState('');
    const [viewingHistoryRuleId, setViewingHistoryRuleId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = store.subscribe(newState => {
            setRules(newState.rules);
            setCategories(newState.ruleCategories);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const handleAddRule = () => {
        if (!newRuleText.trim()) return;
        const category = newRuleCategory.trim() || 'General';
        const newRule: Rule = {
            id: `rule_${Date.now()}`,
            text: newRuleText.trim(),
            timestamp: Date.now(),
            isFrozen: false,
            category,
            history: [],
        };
        store.setState(s => {
            const newCategories = s.ruleCategories.includes(category) ? s.ruleCategories : [...s.ruleCategories, category];
            return { ...s, rules: [...s.rules, newRule], ruleCategories: newCategories };
        });
        setNewRuleText('');
        setNewRuleCategory('');
        addNotification(`New rule synthesized in ${category}.`);
    };

    const handleUpdateRule = (id: string) => {
        if (!editingRuleText.trim()) return;
        store.setState(s => ({
            ...s,
            rules: s.rules.map(r => {
                if (r.id === id) {
                    const newHistory = [...r.history, { text: r.text, timestamp: r.timestamp }];
                    return { ...r, text: editingRuleText, timestamp: Date.now(), history: newHistory };
                }
                return r;
            })
        }));
        setEditingRuleId(null);
        setEditingRuleText('');
        addNotification('Rule DNA updated.');
    };

    const handleDeleteRule = (id: string) => {
        if (window.confirm('Are you sure you want to permanently delete this rule?')) {
            store.setState(s => ({ ...s, rules: s.rules.filter(r => r.id !== id) }));
            addNotification('Rule purged from consciousness.');
        }
    };

    const handleToggleFreeze = (id: string) => {
        store.setState(s => ({
            ...s,
            rules: s.rules.map(r => r.id === id ? { ...r, isFrozen: !r.isFrozen } : r)
        }));
    };

    const handleDuplicateRule = (rule: Rule) => {
        const newRule: Rule = {
            ...rule,
            id: `rule_${Date.now()}`,
            text: `${rule.text} (copy)`,
            timestamp: Date.now(),
            history: [],
        };
        store.setState(s => ({ ...s, rules: [...s.rules, newRule] }));
        addNotification('Rule fragment branched.');
    };

    const handleRenameCategory = (oldCategory: string) => {
        const newCategory = prompt(`Rename category "${oldCategory}" to:`, oldCategory);
        if (newCategory && newCategory.trim() && newCategory !== oldCategory) {
            store.setState(s => ({
                ...s,
                rules: s.rules.map(r => r.category === oldCategory ? { ...r, category: newCategory } : r),
                ruleCategories: s.ruleCategories.map(c => c === oldCategory ? newCategory : c),
            }));
            addNotification(`Category re-labeled to "${newCategory}".`);
        }
    };

    const handleDeleteCategory = (category: string) => {
        if (window.confirm(`Delete category "${category}"?\nAll rules in this category will be moved to "General".`)) {
             store.setState(s => ({
                ...s,
                rules: s.rules.map(r => r.category === category ? { ...r, category: 'General' } : r),
                ruleCategories: s.ruleCategories.filter(c => c !== category),
            }));
            addNotification(`Category "${category}" dissolved.`);
        }
    };
    
    const handleRevertHistory = (ruleId: string, historyItem: { text: string; timestamp: number }) => {
        if(window.confirm('Revert to this version? The current text will be added to history.')){
            store.setState(s => ({
                ...s,
                rules: s.rules.map(r => {
                    if (r.id === ruleId) {
                        const newHistory = [...r.history, { text: r.text, timestamp: r.timestamp }];
                        return { ...r, text: historyItem.text, timestamp: Date.now(), history: newHistory };
                    }
                    return r;
                })
            }));
            addNotification('Temporal revert successful.');
        }
    };

    const filteredRules = rules.filter(rule =>
        rule.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping by all known categories to ensure 'General' shows even if empty
    const groupedRules = categories.reduce((acc, category) => {
        acc[category] = filteredRules.filter(r => r.category === category);
        return acc;
    }, {} as Record<string, Rule[]>);


    return React.createElement('div', { className: 'rules-app-container' },
        React.createElement('div', { className: 'rules-header-section' },
            React.createElement('h2', null, '📜 AIZA_CORE_RULES'),
            React.createElement('div', { className: 'rules-search-container' },
                React.createElement('span', { className: 'search-icon' }, '🔍'),
                React.createElement('input', {
                    type: 'text',
                    placeholder: 'Search neural directives...',
                    className: 'search-bar',
                    value: searchQuery,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)
                })
            )
        ),
        
        React.createElement('div', { className: 'rules-list' },
            // Added explicit cast to [string, Rule[]][] to fix type errors on Object.entries
            (Object.entries(groupedRules) as [string, Rule[]][]).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, rulesInCategory]) =>
                React.createElement(React.Fragment, { key: category },
                    React.createElement('div', { className: 'rules-category-header' },
                        React.createElement('div', { className: 'category-title-wrap' },
                            React.createElement('span', { className: 'folder-icon' }, '📂'),
                            React.createElement('span', null, category.toUpperCase())
                        ),
                        React.createElement('div', { className: 'category-controls' },
                            React.createElement('button', { onClick: () => handleRenameCategory(category), title: 'Rename Category' }, 'RENAME'),
                            category !== 'General' && React.createElement('button', { onClick: () => handleDeleteCategory(category), title: 'Delete Category', className: 'danger-text' }, 'DISSOLVE')
                        )
                    ),
                    
                    rulesInCategory.length === 0 ? 
                        React.createElement('div', { className: 'empty-category-msg' }, '--- AWAITING DIRECTIVES ---') :
                        rulesInCategory.map(rule => React.createElement('div', { key: rule.id, className: `rule-item ${rule.isFrozen ? 'frozen' : 'active'}` },
                            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: '100%'} },
                                React.createElement('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '15px' } },
                                    React.createElement('div', { className: 'rule-status-dot', title: rule.isFrozen ? 'Inactive (Frozen)' : 'Active' }),
                                    editingRuleId === rule.id
                                        ? React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' } },
                                            React.createElement('textarea', {
                                                value: editingRuleText,
                                                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingRuleText(e.target.value),
                                                className: 'rule-edit-textarea'
                                            }),
                                            React.createElement('div', { className: 'edit-buttons' },
                                                React.createElement('button', { onClick: () => handleUpdateRule(rule.id), className: 'save-btn' }, 'SAVE DNA'),
                                                React.createElement('button', { onClick: () => setEditingRuleId(null) }, 'ABORT')
                                            )
                                        )
                                        : React.createElement('div', { className: 'rule-text-display' },
                                            React.createElement('div', { className: 'rule-category-badge' }, rule.category),
                                            rule.text,
                                            React.createElement('div', { className: 'rule-timestamp' }, `MODIFIED: ${new Date(rule.timestamp).toLocaleTimeString()}`)
                                        ),
                                    React.createElement('div', { className: 'rule-controls' },
                                        React.createElement('button', { onClick: () => handleToggleFreeze(rule.id), title: rule.isFrozen ? 'Unfreeze' : 'Freeze' }, rule.isFrozen ? '♨️' : '❄️'),
                                        !rule.isFrozen && React.createElement('button', { onClick: () => { setEditingRuleId(rule.id); setEditingRuleText(rule.text); }, title: 'Edit' }, '✏️'),
                                        React.createElement('button', { onClick: () => handleDuplicateRule(rule), title: 'Branch' }, '🌱'),
                                        React.createElement('button', { onClick: () => setViewingHistoryRuleId(viewingHistoryRuleId === rule.id ? null : rule.id), title: 'History' }, '🕒'),
                                        !rule.isFrozen && React.createElement('button', { onClick: () => handleDeleteRule(rule.id), title: 'Delete', className: 'danger-text' }, '🗑️')
                                    )
                                ),
                                viewingHistoryRuleId === rule.id && React.createElement('div', { className: 'rule-history-panel' },
                                    React.createElement('h5', null, 'VERSION HISTORY'),
                                    rule.history.length > 0
                                        ? [...rule.history].reverse().map((h, i) => React.createElement('div', { key: i, className: 'history-item' },
                                            React.createElement('span', { className: 'history-item-text' }, `"${h.text.substring(0, 40)}..."`),
                                            React.createElement('button', { className: 'revert-button', onClick: () => handleRevertHistory(rule.id, h) }, 'REVERT')
                                        ))
                                        : React.createElement('p', { style: { fontSize: '10px', color: '#555', paddingLeft: '15px' } }, 'NO PRIOR FRAGMENTS.')
                                )
                            )
                        ))
                )
            )
        ),

        React.createElement('div', { className: 'add-rule-form' },
            React.createElement('h3', null, 'SYNTHESIZE NEW DIRECTIVE'),
            React.createElement('textarea', {
                value: newRuleText,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setNewRuleText(e.target.value),
                placeholder: 'Input new logic fragment...',
                rows: 3,
                className: 'new-rule-textarea'
            }),
            React.createElement('div', { className: 'add-rule-footer' },
                React.createElement('input', {
                    type: 'text',
                    list: 'category-suggestions',
                    value: newRuleCategory,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewRuleCategory(e.target.value),
                    placeholder: 'Assign Category...',
                    className: 'category-input'
                }),
                React.createElement('datalist', { id: 'category-suggestions' },
                    categories.map(cat => React.createElement('option', { key: cat, value: cat }))
                ),
                React.createElement('button', { onClick: handleAddRule, className: 'add-btn' }, 'INJECT RULE')
            )
        )
    );
};

export const rulesApp: AppDef = {
    id: 'rules',
    name: 'Rules',
    component: RulesComponent,
    icon: '📜',
    category: 'System',
    defaultSize: { width: 650, height: 600 },
    description: 'The master registry of operational constraints and behavioral logic for AIZA.'
};
