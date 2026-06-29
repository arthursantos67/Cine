export function toUserDTO(user) {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username,
    role: user.role,
    is_staff: user.role === 'staff' || user.role === 'master',
    is_primary_master: user.isPrimaryMaster === true,
    is_protected: user.isPrimaryMaster === true,
    created_at: user.createdAt?.toISOString?.() ?? user.createdAt,
  }
}
