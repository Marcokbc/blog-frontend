import type { PostsRepository } from '../../domain/post';
import { draftinPostsService } from '../draftin/posts.service';

/**
 * Fachada desacoplada do provedor de CMS.
 * Para substituir o DraftIn por outro backend no futuro, basta fornecer uma nova
 * implementação da interface `PostsRepository`.
 */
export const postsRepository: PostsRepository = draftinPostsService;

