import { useState, useRef, useEffect } from 'react';

const SearchableUserSelect = ({ 
  value, 
  onChange, 
  users, 
  disabled = false, 
  placeholder = "选择用户",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // 根据 value 找到选中的用户
  useEffect(() => {
    if (value) {
      const user = users.find(u => String(u.id) === String(value));
      setSelectedUser(user || null);
      if (user) {
        setSearchTerm(user.username);
      }
    } else {
      setSelectedUser(null);
      setSearchTerm('');
    }
  }, [value, users]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // 如果关闭时没有选中用户，清空搜索
        if (!selectedUser) {
          setSearchTerm('');
        } else {
          setSearchTerm(selectedUser.username);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedUser]);

  // 过滤用户
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.username);
    onChange(user.id);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
    // 如果清空输入，取消选择
    if (term === '') {
      setSelectedUser(null);
      onChange('');
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedUser(null);
    setSearchTerm('');
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 md:px-4 py-2 theme-input rounded-md text-sm md:text-base pr-8 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {selectedUser && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
              aria-label="清除选择"
            >
              ×
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 theme-dropdown border border-runeterra-gold/30 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredUsers.length > 0 ? (
            <div className="py-1">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedUser && String(selectedUser.id) === String(user.id)
                      ? 'bg-runeterra-gold/20 text-runeterra-gold'
                      : 'theme-dropdown-item hover:bg-runeterra-gold/10'
                  }`}
                >
                  {user.username}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm theme-text-muted text-center">
              未找到匹配的用户
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableUserSelect;

