-- Remove role 'user' do usuário admin, mantendo apenas 'admin'
DELETE FROM user_roles 
WHERE user_id = '00c6aaea-b6d3-466b-8a2b-8007769e312f' 
AND role = 'user';